import { account, and, eq, user } from "@keynest/db"
import {
	CREDENTIAL_PROVIDER,
	LoginSchema,
	SignupSchema,
	UserPublicSchema
} from "@keynest/shared"
import { Hono, type Context } from "hono"
import { describeRoute, validator } from "hono-openapi"
import { getConnInfo } from "hono/cloudflare-workers"

import type { ApiEnv } from "../../env"
import { conflict, internalError, invalidCredentials } from "../../lib/http"
import {
	CONFLICT_RESPONSE,
	INTERNAL_SERVER_ERROR,
	INVALID_CREDENTIALS_RESPONSE,
	jsonContent
} from "../../lib/openapi"
import { hashPassword, passwordMatches } from "../../lib/password"
import { toPublicUser } from "../../lib/user"
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

async function startSession(c: Context<ApiEnv>, userId: string): Promise<void> {
	const db = c.get("db")
	const existingSessionId = c.get("sessionId")
	if (existingSessionId) await destroySession(db, existingSessionId)

	const token = await createSession(db, userId, clientMeta(c))
	await setSessionCookie(c, token)
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
				201: jsonContent(UserPublicSchema, "Account created"),
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
			let createdId: string | null = null

			try {
				const [createdUser] = await db
					.insert(user)
					.values({ email, name })
					.returning()

				if (!createdUser) throw internalError("Failed to create user")
				createdId = createdUser.id

				await db.insert(account).values({
					accountId: createdUser.id,
					password: passwordHash,
					providerId: CREDENTIAL_PROVIDER,
					userId: createdUser.id
				})

				await startSession(c, createdUser.id)
				return c.json(toPublicUser(createdUser), 201)
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
				200: jsonContent(UserPublicSchema, "Authenticated user"),
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

			await startSession(c, row.user.id)
			return c.json(toPublicUser(row.user))
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
