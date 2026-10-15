import { eq, recoveryCode, user } from "@keynest/db"
import {
	ApiErrorSchema,
	DisableTotpInputSchema,
	RecoveryCodesResultSchema,
	TotpCodeSchema,
	TotpSetupResultSchema
} from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { badRequest, internalError } from "../../lib/http"
import {
	INVALID_CREDENTIALS_RESPONSE,
	jsonContent,
	UNAUTHORIZED_RESPONSE
} from "../../lib/openapi"
import { hashVerifier, verifierMatches } from "../../lib/password"
import { openString, sealString } from "../../lib/secret-box"
import {
	generateRecoveryCodes,
	generateTotpSecret,
	normalizeRecoveryCode,
	otpauthUrl,
	verifyTotp
} from "../../lib/totp"
import { storedVerifier } from "../../lib/user"
import { getAuthUser, requireAuth } from "../../middleware/auth"
import { confirmSecondFactor } from "../../services/second-factor"
import { destroyUserSessions } from "../../services/session"

export const totpRoutes = new Hono<ApiEnv>()
	.post(
		"/totp/setup",
		describeRoute({
			description:
				"Start authenticator setup. The factor is off until confirmed.",
			responses: {
				200: jsonContent(TotpSetupResultSchema, "Authenticator secret"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		requireAuth,
		async (c) => {
			const current = getAuthUser(c)
			if (current.totpEnabled)
				throw badRequest("Turn off the current authenticator first.")

			const secret = generateTotpSecret()
			await c
				.get("db")
				.update(user)
				.set({
					totpEnabled: false,
					totpSecret: sealString(secret, c.env.COOKIE_SECRET)
				})
				.where(eq(user.id, current.id))

			return c.json({
				otpauthUrl: otpauthUrl(current.email, secret),
				secret
			})
		}
	)
	.post(
		"/totp/confirm",
		describeRoute({
			description:
				"Enable the authenticator and return one-time recovery codes.",
			responses: {
				200: jsonContent(RecoveryCodesResultSchema, "Recovery codes"),
				400: jsonContent(ApiErrorSchema, "Incorrect code"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		requireAuth,
		validator("json", TotpCodeSchema),
		async (c) => {
			const current = getAuthUser(c)
			const db = c.get("db")
			const [row] = await db
				.select()
				.from(user)
				.where(eq(user.id, current.id))
				.limit(1)
			if (!row?.totpSecret) throw badRequest("Start authenticator setup first.")

			let secret: string
			try {
				secret = openString(row.totpSecret, c.env.COOKIE_SECRET)
			} catch {
				throw internalError("Authenticator secret could not be read")
			}
			if (!verifyTotp(secret, c.req.valid("json").code))
				throw badRequest("Incorrect authentication code")

			const codes = generateRecoveryCodes()
			await db.delete(recoveryCode).where(eq(recoveryCode.userId, current.id))
			await db.insert(recoveryCode).values(
				codes.map((code) => ({
					codeHash: hashVerifier(normalizeRecoveryCode(code)),
					userId: current.id
				}))
			)
			await db
				.update(user)
				.set({ totpEnabled: true })
				.where(eq(user.id, current.id))

			return c.json({ recoveryCodes: codes })
		}
	)
	.post(
		"/totp/disable",
		describeRoute({
			description: "Turn off the authenticator and sign out other sessions.",
			responses: {
				204: { description: "Authenticator disabled" },
				400: INVALID_CREDENTIALS_RESPONSE,
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		requireAuth,
		validator("json", DisableTotpInputSchema),
		async (c) => {
			const current = getAuthUser(c)
			const db = c.get("db")
			const input = c.req.valid("json")
			const hash = await storedVerifier(db, current.id)
			if (!verifierMatches(input.verifier, hash))
				throw badRequest("Incorrect password")

			const [row] = await db
				.select()
				.from(user)
				.where(eq(user.id, current.id))
				.limit(1)
			if (!row?.totpEnabled) throw badRequest("Authenticator is already off.")
			if (!(await confirmSecondFactor(c, row, input.code)))
				throw badRequest("Incorrect authentication code")

			await db
				.update(user)
				.set({ totpEnabled: false, totpSecret: null })
				.where(eq(user.id, current.id))
			await db.delete(recoveryCode).where(eq(recoveryCode.userId, current.id))
			const sessionId = c.get("sessionId")
			if (sessionId) await destroyUserSessions(db, current.id, sessionId)
			return c.body(null, 204)
		}
	)
