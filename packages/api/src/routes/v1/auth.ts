import { account, and, eq, user } from "@keynest/db"
import {
	apiError,
	AuthSessionSchema,
	CREDENTIAL_PROVIDER,
	LoginSchema,
	SignupSchema,
	UnlockSchema
} from "@keynest/shared"
import { Hono, type Context } from "hono"
import { describeRoute, validator } from "hono-openapi"
import { getConnInfo } from "hono/cloudflare-workers"

import type { ApiEnv } from "../../env"
import {
	badRequest,
	conflict,
	internalError,
	invalidCredentials
} from "../../lib/http"
import {
	CONFLICT_RESPONSE,
	INTERNAL_SERVER_ERROR,
	INVALID_CREDENTIALS_RESPONSE,
	jsonContent,
	UNAUTHORIZED_RESPONSE
} from "../../lib/openapi"
import { hashPassword, passwordMatches } from "../../lib/password"
import { createVaultSalt, ensureVaultSalt, toAuthSession } from "../../lib/user"
import { getAuthUser, requireAuth } from "../../middleware/auth"
import { clearSessionCookie, setSessionCookie } from "../../services/cookie"
import {
	createSession,
	destroySession,
	type SessionClient
} from "../../services/session"

function clientMeta(c: Context<ApiEnv>): SessionClient {
	const { remote } = getConnInfo(c)
	return {
		ipAddress: remote.address ?? null,
		userAgent: c.req.header("user-agent") ?? null
	}
}

async function startSession(c: Context<ApiEnv>, userId: string): Promise<Date> {
	const db = c.get("db")
	const existingSessionId = c.get("sessionId")
	if (existingSessionId) await destroySession(db, existingSessionId)

	const { expiresAt, token } = await createSession(db, userId, clientMeta(c))
	await setSessionCookie(c, token)
	return expiresAt
}

function isUniqueViolation(error: unknown): boolean {
	return (
		error instanceof Error && error.message.includes("UNIQUE constraint failed")
	)
}

export const authRoutes = new Hono<ApiEnv>()
	.post(
		"/signup",
		describeRoute({
			description: "Create an account with email and password.",
			responses: {
				201: jsonContent(AuthSessionSchema, "Account created"),
				409: CONFLICT_RESPONSE,
				500: INTERNAL_SERVER_ERROR
			},
			tags: ["Auth"]
		}),
		validator("json", SignupSchema),
		async (c) => {
			const { email, name, password } = c.req.valid("json")
			const db = c.get("db")

			const [existing] = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, email))
				.limit(1)

			if (existing) throw conflict("An account with this email already exists")

			const passwordHash = await hashPassword(password)
			const vaultSalt = createVaultSalt()
			let createdId: string | null = null

			try {
				const [createdUser] = await db
					.insert(user)
					.values({ email, name, vaultSalt })
					.returning()

				if (!createdUser) throw internalError("Failed to create user")
				createdId = createdUser.id
				const saved = await ensureVaultSalt(db, createdUser)

				await db.insert(account).values({
					accountId: saved.id,
					password: passwordHash,
					providerId: CREDENTIAL_PROVIDER,
					userId: saved.id
				})

				const expiresAt = await startSession(c, saved.id)
				return c.json(toAuthSession(saved, expiresAt), 201)
			} catch (error) {
				if (createdId) await db.delete(user).where(eq(user.id, createdId))

				if (isUniqueViolation(error))
					throw conflict("An account with this email already exists")

				throw error
			}
		}
	)
	.post(
		"/login",
		describeRoute({
			description: "Log in with email and password.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Authenticated user"),
				401: INVALID_CREDENTIALS_RESPONSE
			},
			tags: ["Auth"]
		}),
		validator("json", LoginSchema),
		async (c) => {
			const { email, password } = c.req.valid("json")
			const db = c.get("db")

			const [row] = await db
				.select({ account, user })
				.from(user)
				.innerJoin(
					account,
					and(
						eq(account.userId, user.id),
						eq(account.providerId, CREDENTIAL_PROVIDER)
					)
				)
				.where(eq(user.email, email))
				.limit(1)

			const matches = await passwordMatches(
				password,
				row?.account.password ?? null
			)
			if (!row?.account.password || !matches) throw invalidCredentials()

			const stored = await ensureVaultSalt(db, row.user)
			const expiresAt = await startSession(c, stored.id)
			return c.json(toAuthSession(stored, expiresAt))
		}
	)
	.post(
		"/unlock",
		describeRoute({
			description:
				"Confirm the account password before the browser derives the vault key.",
			responses: {
				204: { description: "Password confirmed" },
				400: jsonContent(apiError, "Incorrect password"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		requireAuth,
		validator("json", UnlockSchema),
		async (c) => {
			const current = getAuthUser(c)
			const { password } = c.req.valid("json")
			const db = c.get("db")

			const [row] = await db
				.select({ password: account.password })
				.from(account)
				.where(
					and(
						eq(account.userId, current.id),
						eq(account.providerId, CREDENTIAL_PROVIDER)
					)
				)
				.limit(1)

			const matches = await passwordMatches(password, row?.password ?? null)
			if (!row?.password || !matches) throw badRequest("Incorrect password")

			return c.body(null, 204)
		}
	)
	.post(
		"/logout",
		describeRoute({
			description: "End the current session.",
			responses: {
				204: { description: "Logged out" }
			},
			tags: ["Auth"]
		}),
		async (c) => {
			const sessionId = c.get("sessionId")
			if (sessionId) await destroySession(c.get("db"), sessionId)
			clearSessionCookie(c)
			return c.body(null, 204)
		}
	)
