import { account, and, eq, user, type Database } from "@keynest/db"
import {
	AcceptedSchema,
	ApiErrorSchema,
	AuthSessionSchema,
	ChangePasswordInputSchema,
	CREDENTIAL_PROVIDER,
	DeleteAccountInputSchema,
	EMAIL_CONFIRM_SESSION_SECONDS,
	EMAIL_TOKEN_TTL_MS,
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM,
	LoginInputSchema,
	PreloginResultSchema,
	PreloginSchema,
	RecoverInputSchema,
	ResendVerificationSchema,
	RotateRecoveryInputSchema,
	SESSION_TTL_SECONDS,
	SignupInputSchema,
	TOTP_MAX_ATTEMPTS,
	TOTP_TICKET_TTL_MS,
	TotpConfirmLoginInputSchema,
	VerifyEmailSchema
} from "@keynest/shared"
import { Hono, type Context } from "hono"
import { describeRoute, validator } from "hono-openapi"
import { getConnInfo } from "hono/cloudflare-workers"

import type { ApiEnv } from "../../env"
import {
	badRequest,
	forbidden,
	internalError,
	invalidCredentials
} from "../../lib/http"
import {
	INTERNAL_SERVER_ERROR,
	INVALID_CREDENTIALS_RESPONSE,
	jsonContent,
	TOO_MANY_REQUESTS,
	UNAUTHORIZED_RESPONSE
} from "../../lib/openapi"
import { hashVerifier, verifierMatches } from "../../lib/password"
import {
	enforceAuthAccount,
	enforceAuthIp,
	limitAuthSession
} from "../../lib/rate-limit"
import {
	placeholderPrelogin,
	readPrelogin,
	readVaultUser,
	storedVerifier,
	toAuthSession
} from "../../lib/user"
import { getAuthUser, requireAuth } from "../../middleware/auth"
import { clearSessionCookie, setSessionCookie } from "../../services/cookie"
import { isLocalRequest, mailConfigured, sendMail } from "../../services/mail"
import { confirmSecondFactor } from "../../services/second-factor"
import {
	createSession,
	destroySession,
	destroyUserSessions,
	type SessionClient
} from "../../services/session"
import {
	deleteToken,
	issueToken,
	parseEmailChange,
	readToken,
	replaceTokenIdentifier
} from "../../services/verification"

const INCORRECT_PASSWORD = jsonContent(ApiErrorSchema, "Incorrect password")

function clientMeta(c: Context<ApiEnv>): SessionClient {
	const { remote } = getConnInfo(c)
	return {
		ipAddress: remote.address ?? null,
		userAgent: c.req.header("user-agent") ?? null
	}
}

const ACCEPTED = { status: "accepted" as const }

function verifyLink(origin: string, token: string) {
	return `${origin}/verify-email?token=${encodeURIComponent(token)}`
}

async function sendVerification(
	c: Context<ApiEnv>,
	userId: string,
	email: string
) {
	const token = await issueToken(
		c.get("db"),
		`verify-email:${userId}`,
		EMAIL_TOKEN_TTL_MS
	)
	await sendMail(
		c.env,
		{
			subject: "Confirm your Keynest email",
			text: `Confirm this email for Keynest:\n${verifyLink(c.env.CORS_ORIGIN, token)}\n\nThis link expires in 24 hours.`,
			to: email
		},
		isLocalRequest(c.req.url)
	)
}

async function startSession(
	c: Context<ApiEnv>,
	userId: string,
	ttlSeconds = SESSION_TTL_SECONDS
): Promise<Date> {
	const db = c.get("db")
	const existingSessionId = c.get("sessionId")
	if (existingSessionId) await destroySession(db, existingSessionId)

	const { expiresAt, token } = await createSession(
		db,
		userId,
		clientMeta(c),
		ttlSeconds
	)
	await setSessionCookie(c, token, ttlSeconds)
	return expiresAt
}

function isUniqueViolation(error: unknown): boolean {
	return (
		error instanceof Error && error.message.includes("UNIQUE constraint failed")
	)
}

function wrapValues(
	input: {
		keyCheck: string
		keyCheckNonce: string
		vaultSalt: string
		wrappedKey: string
		wrappedKeyNonce: string
	},
	kdf: {
		kdfIterations: number
		kdfMemory: number
		kdfParallelism: number
	}
) {
	return {
		kdfIterations: kdf.kdfIterations,
		kdfMemory: kdf.kdfMemory,
		kdfParallelism: kdf.kdfParallelism,
		keyCheck: input.keyCheck,
		keyCheckNonce: input.keyCheckNonce,
		vaultSalt: input.vaultSalt,
		wrappedKey: input.wrappedKey,
		wrappedKeyNonce: input.wrappedKeyNonce
	}
}

async function saveWrap(
	db: Database,
	userId: string,
	accountId: string,
	previous: ReturnType<typeof wrapValues>,
	next: ReturnType<typeof wrapValues>,
	verifierHash: string
) {
	const [updated] = await db
		.update(user)
		.set(next)
		.where(eq(user.id, userId))
		.returning()

	const stored = updated ? readVaultUser(updated) : null
	if (!stored) throw internalError("Failed to update vault keys")

	try {
		await db
			.update(account)
			.set({ password: verifierHash })
			.where(eq(account.id, accountId))
	} catch (error) {
		await db.update(user).set(previous).where(eq(user.id, userId))
		throw error
	}

	return stored
}

async function credentialAccount(c: Context<ApiEnv>, userId: string) {
	const [row] = await c
		.get("db")
		.select({ id: account.id, password: account.password })
		.from(account)
		.where(
			and(
				eq(account.userId, userId),
				eq(account.providerId, CREDENTIAL_PROVIDER)
			)
		)
		.limit(1)

	return row ?? null
}

export const authRoutes = new Hono<ApiEnv>()
	.post(
		"/prelogin",
		describeRoute({
			description:
				"Return the KDF parameters and recovery wrap for an email. Unknown emails receive placeholder material.",
			responses: {
				200: jsonContent(PreloginResultSchema, "KDF parameters"),
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", PreloginSchema),
		async (c) => {
			const { email } = c.req.valid("json")
			await enforceAuthAccount(c, email)
			const [row] = await c
				.get("db")
				.select()
				.from(user)
				.where(eq(user.email, email))
				.limit(1)

			const material = row ? readPrelogin(row) : null
			return c.json(material ?? placeholderPrelogin(c.env.COOKIE_SECRET, email))
		}
	)
	.post(
		"/signup",
		describeRoute({
			description:
				"Create an account. The server stores an authentication verifier and wrapped vault keys, not the master password.",
			responses: {
				200: jsonContent(
					AcceptedSchema,
					"Accepted. When email delivery is configured, confirm the address before signing in."
				),
				201: jsonContent(AuthSessionSchema, "Account created"),
				429: TOO_MANY_REQUESTS,
				500: INTERNAL_SERVER_ERROR
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", SignupInputSchema),
		async (c) => {
			const input = c.req.valid("json")
			await enforceAuthAccount(c, input.email)
			const db = c.get("db")
			const deliverMail = mailConfigured(c.env)

			const [existing] = await db
				.select({ emailVerified: user.emailVerified, id: user.id })
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1)

			if (existing) {
				if (deliverMail && !existing.emailVerified)
					await sendVerification(c, existing.id, input.email)
				else if (deliverMail) {
					await sendMail(
						c.env,
						{
							subject: "Keynest sign-in",
							text: "A Keynest account already uses this email. Sign in with your password. If you did not try to create an account, you can ignore this message.",
							to: input.email
						},
						isLocalRequest(c.req.url)
					)
				}
				return c.json(ACCEPTED)
			}

			let createdId: string | null = null

			try {
				const [createdUser] = await db
					.insert(user)
					.values({
						email: input.email,
						emailVerified: !deliverMail,
						keyCheck: input.keyCheck,
						keyCheckNonce: input.keyCheckNonce,
						kdfIterations: KDF_ITERATIONS,
						kdfMemory: KDF_MEMORY_KIB,
						kdfParallelism: KDF_PARALLELISM,
						name: input.name,
						recoverySalt: input.recoverySalt,
						recoveryVerifier: hashVerifier(input.recoveryVerifier),
						recoveryWrappedKey: input.recoveryWrappedKey,
						recoveryWrappedKeyNonce: input.recoveryWrappedKeyNonce,
						vaultSalt: input.vaultSalt,
						wrappedKey: input.wrappedKey,
						wrappedKeyNonce: input.wrappedKeyNonce
					})
					.returning()

				if (!createdUser) throw internalError("Failed to create user")
				createdId = createdUser.id
				const stored = readVaultUser(createdUser)
				if (!stored) throw internalError("Failed to store vault keys")

				await db.insert(account).values({
					accountId: stored.id,
					password: hashVerifier(input.verifier),
					providerId: CREDENTIAL_PROVIDER,
					userId: stored.id
				})

				if (deliverMail) {
					await sendVerification(c, stored.id, input.email)
					return c.json(ACCEPTED)
				}

				const expiresAt = await startSession(c, stored.id)
				return c.json(toAuthSession(stored, expiresAt), 201)
			} catch (error) {
				if (createdId) await db.delete(user).where(eq(user.id, createdId))

				if (isUniqueViolation(error)) return c.json(ACCEPTED)

				throw error
			}
		}
	)
	.post(
		"/login",
		describeRoute({
			description: "Log in with an email and an authentication verifier.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Authenticated user"),
				400: jsonContent(ApiErrorSchema, "Account is missing vault keys"),
				401: INVALID_CREDENTIALS_RESPONSE,
				403: jsonContent(ApiErrorSchema, "Email is not confirmed"),
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", LoginInputSchema),
		async (c) => {
			const { email, verifier } = c.req.valid("json")
			await enforceAuthAccount(c, email)
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

			const matches = verifierMatches(verifier, row?.account.password ?? null)
			if (!row?.account.password || !matches) throw invalidCredentials()
			if (!row.user.emailVerified)
				throw forbidden("Confirm your email, then sign in.")

			const stored = readVaultUser(row.user)
			if (!stored)
				throw badRequest(
					"This account is missing vault keys. Create a new account."
				)

			if (row.user.totpEnabled) {
				const ticket = await issueToken(
					db,
					`totp-login:0:${stored.id}`,
					TOTP_TICKET_TTL_MS
				)
				return c.json({ ticket, totpRequired: true as const })
			}

			const expiresAt = await startSession(c, stored.id)
			return c.json(toAuthSession(stored, expiresAt))
		}
	)
	.post(
		"/totp",
		describeRoute({
			description: "Finish login with an authenticator code or recovery code.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Authenticated user"),
				401: INVALID_CREDENTIALS_RESPONSE,
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", TotpConfirmLoginInputSchema),
		async (c) => {
			const { code, ticket } = c.req.valid("json")
			const db = c.get("db")
			const pending = await readToken(db, ticket)
			if (!pending?.identifier.startsWith("totp-login:"))
				throw invalidCredentials("That sign-in code expired. Try again.")

			const [, attemptsText, userId] = pending.identifier.split(":")
			const attempts = Number(attemptsText)
			if (!userId || Number.isNaN(attempts)) throw invalidCredentials()

			const [row] = await db
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.limit(1)
			const stored = row ? readVaultUser(row) : null
			if (!row?.totpSecret || !stored) throw invalidCredentials()

			const matched = await confirmSecondFactor(c, row, code)
			if (!matched) {
				if (attempts + 1 >= TOTP_MAX_ATTEMPTS) {
					await deleteToken(db, pending.id)
					throw invalidCredentials("That sign-in code expired. Try again.")
				}
				await replaceTokenIdentifier(
					db,
					pending.id,
					`totp-login:${attempts + 1}:${userId}`
				)
				throw invalidCredentials("Incorrect authentication code")
			}

			await deleteToken(db, pending.id)
			const expiresAt = await startSession(c, stored.id)
			return c.json(toAuthSession(stored, expiresAt))
		}
	)
	.post(
		"/password",
		describeRoute({
			description:
				"Replace the authentication verifier and rewrap the vault data key.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Password updated"),
				400: INCORRECT_PASSWORD,
				401: UNAUTHORIZED_RESPONSE,
				429: TOO_MANY_REQUESTS
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		requireAuth,
		limitAuthSession,
		validator("json", ChangePasswordInputSchema),
		async (c) => {
			const current = getAuthUser(c)
			const input = c.req.valid("json")
			const db = c.get("db")
			const credentials = await credentialAccount(c, current.id)
			const matches = verifierMatches(
				input.verifier,
				credentials?.password ?? null
			)
			if (!credentials?.password || !matches)
				throw badRequest("Incorrect password")

			const stored = await saveWrap(
				db,
				current.id,
				credentials.id,
				wrapValues(current, current),
				wrapValues(input, current),
				hashVerifier(input.newVerifier)
			)

			const sessionId = c.get("sessionId")
			if (sessionId) await destroyUserSessions(db, current.id, sessionId)

			return c.json(toAuthSession(stored, new Date(current.sessionExpiresAt)))
		}
	)
	.post(
		"/recovery",
		describeRoute({
			description:
				"Replace the recovery wrap after the current password verifier matches. The password wrap is left unchanged. The previous recovery code stops working only when this update is stored.",
			responses: {
				204: { description: "Recovery code replaced" },
				400: INCORRECT_PASSWORD,
				401: UNAUTHORIZED_RESPONSE,
				429: TOO_MANY_REQUESTS
			},
			security: [{ SessionCookie: [] }],
			summary: "Issue a new recovery code",
			tags: ["Auth"]
		}),
		requireAuth,
		limitAuthSession,
		validator("json", RotateRecoveryInputSchema),
		async (c) => {
			const current = getAuthUser(c)
			const input = c.req.valid("json")
			const db = c.get("db")
			const credentials = await credentialAccount(c, current.id)
			const matches = verifierMatches(
				input.verifier,
				credentials?.password ?? null
			)
			if (!credentials?.password || !matches)
				throw badRequest("Incorrect password")

			const [updated] = await db
				.update(user)
				.set({
					recoverySalt: input.recoverySalt,
					recoveryVerifier: hashVerifier(input.recoveryVerifier),
					recoveryWrappedKey: input.recoveryWrappedKey,
					recoveryWrappedKeyNonce: input.recoveryWrappedKeyNonce
				})
				.where(eq(user.id, current.id))
				.returning({ id: user.id })

			if (!updated) throw internalError("Failed to update recovery code")
			return c.body(null, 204)
		}
	)
	.post(
		"/recover",
		describeRoute({
			description:
				"Rewrap the vault data key with a new password using the recovery verifier.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Vault recovered"),
				401: INVALID_CREDENTIALS_RESPONSE,
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", RecoverInputSchema),
		async (c) => {
			const input = c.req.valid("json")
			await enforceAuthAccount(c, input.email)
			const db = c.get("db")
			const [row] = await db
				.select()
				.from(user)
				.where(eq(user.email, input.email))
				.limit(1)

			const matches = verifierMatches(
				input.recoveryVerifier,
				row?.recoveryVerifier ?? null
			)
			if (!row?.recoveryVerifier || !matches) throw invalidCredentials()

			const credentials = await credentialAccount(c, row.id)
			if (!credentials) throw invalidCredentials()

			const existing = readVaultUser(row)
			if (!existing) throw invalidCredentials()

			const stored = await saveWrap(
				db,
				row.id,
				credentials.id,
				wrapValues(existing, existing),
				wrapValues(input, existing),
				hashVerifier(input.verifier)
			)

			await destroyUserSessions(db, stored.id)
			const expiresAt = await startSession(c, stored.id)
			return c.json(toAuthSession(stored, expiresAt))
		}
	)
	.post(
		"/delete",
		describeRoute({
			description: "Delete the account, sessions, and encrypted vault items.",
			responses: {
				204: { description: "Account deleted" },
				400: INCORRECT_PASSWORD,
				401: UNAUTHORIZED_RESPONSE,
				429: TOO_MANY_REQUESTS
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		requireAuth,
		limitAuthSession,
		validator("json", DeleteAccountInputSchema),
		async (c) => {
			const current = getAuthUser(c)
			const db = c.get("db")
			const hash = await storedVerifier(db, current.id)
			if (!verifierMatches(c.req.valid("json").verifier, hash))
				throw badRequest("Incorrect password")

			await db.delete(user).where(eq(user.id, current.id))
			clearSessionCookie(c)
			return c.body(null, 204)
		}
	)
	.post(
		"/verify-email",
		describeRoute({
			description:
				"Confirm a new account or finish an email change. The link signs you in.",
			responses: {
				200: jsonContent(AuthSessionSchema, "Email confirmed"),
				401: INVALID_CREDENTIALS_RESPONSE,
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", VerifyEmailSchema),
		async (c) => {
			const db = c.get("db")
			const pending = await readToken(db, c.req.valid("json").token)
			if (!pending)
				throw invalidCredentials(
					"This confirmation link is invalid or expired."
				)
			await deleteToken(db, pending.id)

			let userId = ""
			if (pending.identifier.startsWith("verify-email:")) {
				userId = pending.identifier.slice("verify-email:".length)
				await db
					.update(user)
					.set({ emailVerified: true })
					.where(eq(user.id, userId))
			} else {
				const change = parseEmailChange(pending.identifier)
				if (!change)
					throw invalidCredentials(
						"This confirmation link is invalid or expired."
					)
				const [taken] = await db
					.select({ id: user.id })
					.from(user)
					.where(eq(user.email, change.email))
					.limit(1)
				if (taken && taken.id !== change.userId)
					throw badRequest("That email is no longer available.")
				userId = change.userId
				await db
					.update(user)
					.set({ email: change.email, emailVerified: true })
					.where(eq(user.id, userId))
				await destroyUserSessions(db, userId)
			}

			const [row] = await db
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.limit(1)
			const stored = row ? readVaultUser(row) : null
			if (!stored)
				throw invalidCredentials(
					"This confirmation link is invalid or expired."
				)
			const expiresAt = await startSession(
				c,
				stored.id,
				EMAIL_CONFIRM_SESSION_SECONDS
			)
			return c.json(toAuthSession(stored, expiresAt))
		}
	)
	.post(
		"/verification",
		describeRoute({
			description: "Send another email confirmation link when one is pending.",
			responses: {
				200: jsonContent(AcceptedSchema, "Accepted"),
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", ResendVerificationSchema),
		async (c) => {
			const { email } = c.req.valid("json")
			await enforceAuthAccount(c, email)
			const [row] = await c
				.get("db")
				.select({ emailVerified: user.emailVerified, id: user.id })
				.from(user)
				.where(eq(user.email, email))
				.limit(1)
			if (row && !row.emailVerified && mailConfigured(c.env))
				await sendVerification(c, row.id, email)
			return c.json(ACCEPTED)
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
