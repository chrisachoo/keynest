import { eq, user } from "@keynest/db"
import { emailChangeConfirmationEmail } from "@keynest/services/email"
import {
	isLocalRequest,
	mailConfigured,
	sendMail
} from "@keynest/services/mail"
import {
	emailChangeIdentifier,
	issueToken
} from "@keynest/services/verification"
import {
	AcceptedSchema,
	AuthSessionSchema,
	ChangeEmailInputSchema,
	EMAIL_TOKEN_TTL_MS
} from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { badRequest } from "../../lib/http"
import { jsonContent, UNAUTHORIZED_RESPONSE } from "../../lib/openapi"
import { verifierMatches } from "../../lib/password"
import { storedVerifier } from "../../lib/user"
import { getAuthUser, requireAuth } from "../../middleware/auth"

export const usersRoutes = new Hono<ApiEnv>()
	.post(
		"/email",
		describeRoute({
			description:
				"Send a confirmation link to a new email. The address changes only after the link is opened.",
			responses: {
				200: jsonContent(AcceptedSchema, "Accepted"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Users"]
		}),
		requireAuth,
		validator("json", ChangeEmailInputSchema),
		async (c) => {
			const current = getAuthUser(c)
			const input = c.req.valid("json")
			if (!mailConfigured(c.env))
				throw badRequest("Email delivery is not configured.")
			if (input.email.toLowerCase() === current.email.toLowerCase())
				throw badRequest("That is already your email.")

			const db = c.get("db")
			const hash = await storedVerifier(db, current.id)
			if (!verifierMatches(input.verifier, hash))
				throw badRequest("Incorrect password")

			const [taken] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1)

			if (!taken) {
				const token = await issueToken(
					db,
					emailChangeIdentifier(current.id, input.email),
					EMAIL_TOKEN_TTL_MS
				)

				const link = `${c.env.CORS_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`

				const message = emailChangeConfirmationEmail(input.email, link)
				await sendMail(
					c.env,
					{ ...message, to: input.email },
					isLocalRequest(c.req.url)
				)
			}

			return c.json({ status: "accepted" as const })
		}
	)
	.get(
		"/me",
		describeRoute({
			description: "Return the authenticated account.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Current user"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "Current user",
			tags: ["Users"]
		}),
		requireAuth,
		(c) => c.json(getAuthUser(c))
	)
