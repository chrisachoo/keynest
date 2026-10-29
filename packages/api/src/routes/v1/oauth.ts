import { account, and, eq, user } from "@keynest/db"
import {
	deleteToken,
	issueToken,
	readToken
} from "@keynest/services/verification"
import {
	ApiErrorSchema,
	AuthSessionSchema,
	CREDENTIAL_PROVIDER,
	GOOGLE_PROVIDER,
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM,
	normalizeEmail,
	OAuthCancelInputSchema,
	OAuthCodeInputSchema,
	OAuthCompleteInputSchema,
	OAuthConfirmInputSchema,
	OAuthLoginChallengeSchema,
	OAuthPendingProfileSchema,
	OAuthPendingResultSchema,
	OAuthStateResultSchema,
	TOTP_TICKET_TTL_MS,
	TotpChallengeSchema
} from "@keynest/shared"
import { Hono, type Context } from "hono"
import { describeRoute, validator } from "hono-openapi"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import * as oauth from "oauth4webapi"
import * as v from "valibot"

import type { ApiEnv } from "../../env"
import {
	badRequest,
	conflict,
	internalError,
	invalidCredentials
} from "../../lib/http"
import {
	INTERNAL_SERVER_ERROR,
	jsonContent,
	TOO_MANY_REQUESTS
} from "../../lib/openapi"
import { hashVerifier, verifierMatches } from "../../lib/password"
import { enforceAuthAccount, enforceAuthIp } from "../../lib/rate-limit"
import {
	googleLoginIdentifier,
	linkGoogleAccount,
	parseGoogleLogin,
	readPrelogin,
	readVaultUser,
	storedVerifier,
	toAuthSession,
	totpLoginIdentifier
} from "../../lib/user"
import {
	clearOAuthPendingCookie,
	clearOAuthStateCookie,
	readOAuthPendingCookie,
	readOAuthStateCookie,
	setOAuthPendingCookie,
	setOAuthStateCookie
} from "../../services/cookie"
import { startSession } from "./auth"

// Google's popup-mode CSRF guard: only scripts can set this header cross-origin.
const requireXhrHeader = createMiddleware<ApiEnv>(async (c, next) => {
	if (c.req.header("x-requested-with") !== "XmlHttpRequest")
		throw badRequest("Missing X-Requested-With header")
	await next()
})

const GOOGLE_AS: oauth.AuthorizationServer = {
	issuer: "https://accounts.google.com",
	jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
	token_endpoint: "https://oauth2.googleapis.com/token"
}

const PendingCookieSchema = v.object({
	...OAuthPendingProfileSchema.entries,
	sub: v.string()
})

type GoogleIdentity = { email: string; name: string; sub: string }

function popupRedirectUri(origin: string) {
	return new URL(origin).origin
}

async function exchangeGoogleCode(
	c: Context<ApiEnv>,
	code: string,
	state: string
): Promise<GoogleIdentity> {
	const clientId = c.env.GOOGLE_CLIENT_ID
	const clientSecret = c.env.GOOGLE_CLIENT_SECRET
	if (!clientId || !clientSecret)
		throw internalError("Google sign-in is not configured")

	const client: oauth.Client = { client_id: clientId }
	const redirectUri = popupRedirectUri(c.env.CORS_ORIGIN)

	try {
		const params = oauth.validateAuthResponse(
			GOOGLE_AS,
			client,
			new URLSearchParams({ code, state }),
			state
		)
		const response = await oauth.authorizationCodeGrantRequest(
			GOOGLE_AS,
			client,
			oauth.ClientSecretPost(clientSecret),
			params,
			redirectUri,
			oauth.nopkce
		)
		const result = await oauth.processAuthorizationCodeResponse(
			GOOGLE_AS,
			client,
			response,
			{ requireIdToken: true }
		)
		const claims = oauth.getValidatedIdTokenClaims(result)

		if (
			!claims ||
			claims.email_verified !== true ||
			typeof claims.email !== "string" ||
			typeof claims.sub !== "string" ||
			claims.sub.length === 0 ||
			claims.sub.length > 255
		)
			throw badRequest("Your Google email address is not verified.")

		const email = normalizeEmail(claims.email)
		const name =
			typeof claims.name === "string" && claims.name.trim().length >= 2
				? claims.name.trim().slice(0, 80)
				: email.split("@")[0]!.padEnd(2, "_").slice(0, 80)

		return { email, name, sub: claims.sub }
	} catch (error) {
		if (error instanceof HTTPException) throw error
		throw badRequest("Google sign-in failed. Try again.")
	}
}

async function beginPasswordChallenge(
	c: Context<ApiEnv>,
	row: typeof user.$inferSelect,
	sub: string | null
) {
	clearOAuthPendingCookie(c)
	if (!row.emailVerified)
		throw conflict(
			"Verify your email with your password first, then try Google again."
		)

	const stored = readVaultUser(row)
	const material = readPrelogin(row)
	if (!stored || !material)
		throw badRequest(
			"This account is missing vault keys. Create a new account."
		)

	const ticket = await issueToken(
		c.get("db"),
		googleLoginIdentifier(stored.id, sub),
		TOTP_TICKET_TTL_MS
	)
	return c.json({ ...material, ticket })
}

export const oauthRoutes = new Hono<ApiEnv>()
	.post(
		"/google/state",
		describeRoute({
			description:
				"Store a one-time state cookie for the Google popup. The browser sends that state back with the authorization code.",
			responses: {
				200: jsonContent(OAuthStateResultSchema, "State to pass to Google"),
				429: TOO_MANY_REQUESTS,
				500: INTERNAL_SERVER_ERROR
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		async (c) => {
			const state = oauth.generateRandomState()
			await setOAuthStateCookie(c, state)
			return c.json({ state })
		}
	)
	.post(
		"/google",
		describeRoute({
			description:
				"Exchange a Google popup authorization code. A new account returns a pending profile. An existing account returns a password challenge. The session starts only after the master password matches.",
			responses: {
				200: jsonContent(
					v.union([OAuthPendingResultSchema, OAuthLoginChallengeSchema]),
					"Vault setup pending, or master password required"
				),
				400: jsonContent(ApiErrorSchema, "Google sign-in failed"),
				409: jsonContent(ApiErrorSchema, "Email not verified for linking"),
				429: TOO_MANY_REQUESTS,
				500: INTERNAL_SERVER_ERROR
			},
			tags: ["Auth"]
		}),
		requireXhrHeader,
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", OAuthCodeInputSchema),
		async (c) => {
			const { code, state } = c.req.valid("json")
			const expectedState = await readOAuthStateCookie(c)
			clearOAuthStateCookie(c)
			if (!expectedState || expectedState !== state)
				throw badRequest("Google sign-in expired. Start again.")

			const identity = await exchangeGoogleCode(c, code, state)
			await enforceAuthAccount(c, identity.email)
			const db = c.get("db")

			const [linked] = await db
				.select({ user })
				.from(account)
				.innerJoin(user, eq(user.id, account.userId))
				.where(
					and(
						eq(account.providerId, GOOGLE_PROVIDER),
						eq(account.accountId, identity.sub)
					)
				)
				.limit(1)
			if (linked) return beginPasswordChallenge(c, linked.user, null)

			const [existing] = await db
				.select()
				.from(user)
				.where(eq(user.email, identity.email))
				.limit(1)

			if (existing) return beginPasswordChallenge(c, existing, identity.sub)

			await setOAuthPendingCookie(c, JSON.stringify(identity))
			return c.json({
				email: identity.email,
				name: identity.name,
				status: "pending" as const
			})
		}
	)
	.post(
		"/google/confirm",
		describeRoute({
			description:
				"Finish Google sign-in after the master-password verifier matches. Starts a session, or returns a second-factor challenge. Links Google only when the session is created.",
			responses: {
				200: jsonContent(
					v.union([AuthSessionSchema, TotpChallengeSchema]),
					"Signed in, or second factor required"
				),
				401: jsonContent(ApiErrorSchema, "Incorrect master password"),
				429: TOO_MANY_REQUESTS,
				500: INTERNAL_SERVER_ERROR
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", OAuthConfirmInputSchema),
		async (c) => {
			const { ticket, verifier } = c.req.valid("json")
			const db = c.get("db")
			const pending = await readToken(db, ticket)
			const login = pending ? parseGoogleLogin(pending.identifier) : null
			if (!pending || !login)
				throw invalidCredentials("That sign-in code expired. Try again.")

			const [row] = await db
				.select()
				.from(user)
				.where(eq(user.id, login.userId))
				.limit(1)
			const stored = row ? readVaultUser(row) : null
			if (!row || !stored)
				throw invalidCredentials("That sign-in code expired. Try again.")

			await enforceAuthAccount(c, row.email)
			const matches = verifierMatches(
				verifier,
				await storedVerifier(db, stored.id)
			)
			if (!matches) throw invalidCredentials("Incorrect master password.")

			await deleteToken(db, pending.id)

			if (row.totpEnabled) {
				const nextTicket = await issueToken(
					db,
					totpLoginIdentifier(0, stored.id, login.sub),
					TOTP_TICKET_TTL_MS
				)
				return c.json({ ticket: nextTicket, totpRequired: true as const })
			}

			if (login.sub) await linkGoogleAccount(db, stored.id, login.sub)
			const expiresAt = await startSession(c, stored.id)
			return c.json(toAuthSession(stored, expiresAt))
		}
	)
	.post(
		"/google/cancel",
		describeRoute({
			description:
				"Clear a pending Google sign-up and an unused Google or second-factor ticket.",
			responses: {
				204: { description: "Cleared" },
				429: TOO_MANY_REQUESTS
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", OAuthCancelInputSchema),
		async (c) => {
			clearOAuthPendingCookie(c)
			const ticket = c.req.valid("json").ticket
			if (ticket) {
				const db = c.get("db")
				const pending = await readToken(db, ticket)
				if (
					pending &&
					(pending.identifier.startsWith("google-login:") ||
						pending.identifier.startsWith("totp-login:"))
				)
					await deleteToken(db, pending.id)
			}
			return c.body(null, 204)
		}
	)
	.post(
		"/google/complete",
		describeRoute({
			description:
				"Finish Google sign-up by uploading client-generated vault keys for the pending Google profile.",
			responses: {
				201: jsonContent(AuthSessionSchema, "Account created"),
				400: jsonContent(ApiErrorSchema, "No pending Google sign-up"),
				409: jsonContent(ApiErrorSchema, "Account already exists"),
				429: TOO_MANY_REQUESTS,
				500: INTERNAL_SERVER_ERROR
			},
			tags: ["Auth"]
		}),
		async (c, next) => {
			await enforceAuthIp(c)
			await next()
		},
		validator("json", OAuthCompleteInputSchema),
		async (c) => {
			const raw = await readOAuthPendingCookie(c)
			let pending: v.InferOutput<typeof PendingCookieSchema> | null = null
			try {
				pending = raw ? v.parse(PendingCookieSchema, JSON.parse(raw)) : null
			} catch {
				pending = null
			}
			if (!pending)
				throw badRequest("Your Google sign-up expired. Start again.")

			const input = c.req.valid("json")
			await enforceAuthAccount(c, pending.email)
			const db = c.get("db")
			let createdId: string | null = null

			try {
				const [created] = await db
					.insert(user)
					.values({
						email: pending.email,
						emailVerified: true,
						kdfIterations: KDF_ITERATIONS,
						kdfMemory: KDF_MEMORY_KIB,
						kdfParallelism: KDF_PARALLELISM,
						keyCheck: input.keyCheck,
						keyCheckNonce: input.keyCheckNonce,
						name: pending.name,
						recoverySalt: input.recoverySalt,
						recoveryVerifier: hashVerifier(input.recoveryVerifier),
						recoveryWrappedKey: input.recoveryWrappedKey,
						recoveryWrappedKeyNonce: input.recoveryWrappedKeyNonce,
						vaultSalt: input.vaultSalt,
						wrappedKey: input.wrappedKey,
						wrappedKeyNonce: input.wrappedKeyNonce
					})
					.returning()

				if (!created) throw internalError("Failed to create user")
				createdId = created.id
				const stored = readVaultUser(created)
				if (!stored) throw internalError("Failed to store vault keys")

				await db.insert(account).values([
					{
						accountId: stored.id,
						password: hashVerifier(input.verifier),
						providerId: CREDENTIAL_PROVIDER,
						userId: stored.id
					},
					{
						accountId: pending.sub,
						providerId: GOOGLE_PROVIDER,
						userId: stored.id
					}
				])

				clearOAuthPendingCookie(c)
				const expiresAt = await startSession(c, stored.id)
				return c.json(toAuthSession(stored, expiresAt), 201)
			} catch (error) {
				if (createdId) await db.delete(user).where(eq(user.id, createdId))
				if (
					error instanceof Error &&
					error.message.includes("UNIQUE constraint failed")
				)
					throw conflict("An account with this email already exists.")
				throw error
			}
		}
	)
