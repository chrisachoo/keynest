import { expect, test } from "bun:test"

import { openMemoryDatabase } from "@keynest/db/memory"
import { CREDENTIAL_PROVIDER, type AuthSession } from "@keynest/shared"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { hashVerifier } from "../../lib/password"
import { authRoutes } from "./auth"

const { db: memory, sqlite } = openMemoryDatabase(`
CREATE TABLE user (
	id text PRIMARY KEY,
	recovery_salt text,
	recovery_verifier text,
	recovery_wrapped_key text,
	recovery_wrapped_key_nonce text,
	wrapped_key text,
	updated_at integer
);
CREATE TABLE account (
	id text PRIMARY KEY,
	user_id text NOT NULL,
	provider_id text NOT NULL,
	password text,
	account_id text NOT NULL
);
`)

const db = memory as unknown as ApiEnv["Variables"]["db"]
const currentVerifier = "a".repeat(43)
const password = hashVerifier(currentVerifier)
sqlite
	.query(
		`INSERT INTO user (
			id, recovery_salt, recovery_verifier, recovery_wrapped_key,
			recovery_wrapped_key_nonce, wrapped_key, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)`
	)
	.run(
		"user-a",
		"original-recovery-salt",
		"original-recovery-verifier",
		"original-wrap",
		"original-nonce",
		"password-wrap",
		Date.now()
	)
sqlite
	.query(
		`INSERT INTO account (id, user_id, provider_id, password, account_id)
		 VALUES (?, ?, ?, ?, ?)`
	)
	.run("account-a", "user-a", CREDENTIAL_PROVIDER, password, "user-a")

const user = {
	email: "ada@example.com",
	emailVerified: true,
	id: "user-a",
	image: null,
	kdfIterations: 3,
	kdfMemory: 65536,
	kdfParallelism: 1,
	keyCheck: "check",
	keyCheckNonce: "check-nonce",
	name: "Ada",
	sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
	totpEnabled: false,
	vaultSalt: "vault-salt-value-here",
	wrappedKey: "password-wrap",
	wrappedKeyNonce: "wrapped-nonce"
} satisfies AuthSession

const app = new Hono<ApiEnv>()
app.use("*", async (c, next) => {
	c.set("db", db as unknown as ApiEnv["Variables"]["db"])
	c.set("sessionId", "session")
	c.set("user", user)
	await next()
})
app.route("/", authRoutes)

const env = {
	AUTH_SESSION: { limit: async () => ({ success: true }) }
} as unknown as ApiEnv["Bindings"]

function body(verifier: string) {
	return JSON.stringify({
		recoverySalt: "new-recovery-salt-value",
		recoveryVerifier: "c".repeat(43),
		recoveryWrappedKey: "new-wrap",
		recoveryWrappedKeyNonce: "new-nonce",
		verifier
	})
}

function recoveryRow() {
	return sqlite
		.query(
			`SELECT recovery_salt, recovery_wrapped_key, wrapped_key
			 FROM user WHERE id = ?`
		)
		.get("user-a") as {
		recovery_salt: string
		recovery_wrapped_key: string
		wrapped_key: string
	}
}

test("a wrong password does not replace the recovery wrap", async () => {
	const response = await app.request(
		"/recovery",
		{
			body: body("b".repeat(43)),
			headers: { "content-type": "application/json" },
			method: "POST"
		},
		env
	)

	expect(response.status).toBe(400)
	expect(recoveryRow()).toMatchObject({
		recovery_salt: "original-recovery-salt",
		recovery_wrapped_key: "original-wrap",
		wrapped_key: "password-wrap"
	})
})

test("the recovery wrap changes only after the password verifier matches", async () => {
	const response = await app.request(
		"/recovery",
		{
			body: body(currentVerifier),
			headers: { "content-type": "application/json" },
			method: "POST"
		},
		env
	)

	expect(response.status).toBe(204)
	expect(recoveryRow()).toMatchObject({
		recovery_salt: "new-recovery-salt-value",
		recovery_wrapped_key: "new-wrap",
		wrapped_key: "password-wrap"
	})
})
