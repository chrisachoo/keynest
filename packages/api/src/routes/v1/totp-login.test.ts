import { expect, test } from "bun:test"
import { createHash } from "node:crypto"

import { openMemoryDatabase } from "@keynest/db/memory"
import { TOTP_MAX_ATTEMPTS } from "@keynest/shared"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { hashVerifier } from "../../lib/password"
import { generateTotpSecret } from "../../lib/totp"
import { sealTotpSecret } from "../../lib/totp-secret"
import { authRoutes } from "./auth"

const totpKey = "test-totp-encryption-key"
const ticket = "totp-login-ticket-value-for-test-only"
const recoveryCode = "abcd-efgh-ijkl-mnop"
const userId = "user-a"

const { db: memory, sqlite } = openMemoryDatabase(`
CREATE TABLE user (
	id text PRIMARY KEY,
	email text NOT NULL UNIQUE,
	name text NOT NULL,
	email_verified integer DEFAULT 0 NOT NULL,
	vault_salt text,
	kdf_memory integer,
	kdf_iterations integer,
	kdf_parallelism integer,
	wrapped_key text,
	wrapped_key_nonce text,
	key_check text,
	key_check_nonce text,
	recovery_wrapped_key text,
	recovery_wrapped_key_nonce text,
	recovery_salt text,
	recovery_verifier text,
	totp_secret text,
	totp_enabled integer DEFAULT 0 NOT NULL,
	image text,
	created_at integer,
	updated_at integer
);
CREATE TABLE verification (
	id text PRIMARY KEY,
	identifier text NOT NULL,
	value text NOT NULL,
	expires_at integer NOT NULL,
	created_at integer,
	updated_at integer
);
CREATE TABLE recovery_code (
	id text PRIMARY KEY,
	user_id text NOT NULL,
	code_hash text NOT NULL,
	used_at integer,
	created_at integer
);
CREATE TABLE session (
	id text PRIMARY KEY,
	token text NOT NULL UNIQUE,
	user_id text NOT NULL,
	expires_at integer NOT NULL,
	ip_address text,
	user_agent text,
	created_at integer,
	updated_at integer
);
`)

const db = memory as unknown as ApiEnv["Variables"]["db"]
const now = Date.now()

sqlite
	.query(
		`INSERT INTO user (
			id, email, name, email_verified, vault_salt, kdf_memory, kdf_iterations,
			kdf_parallelism, wrapped_key, wrapped_key_nonce, key_check, key_check_nonce,
			totp_secret, totp_enabled, created_at, updated_at
		) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
	)
	.run(
		userId,
		"ada@example.com",
		"Ada",
		"vault-salt",
		65536,
		3,
		1,
		"wrap",
		"wrap-nonce",
		"check",
		"check-nonce",
		sealTotpSecret(generateTotpSecret(), totpKey),
		now,
		now
	)

sqlite
	.query(
		`INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	)
	.run(
		"ticket-row",
		`totp-login:0:${userId}`,
		createHash("sha256").update(ticket).digest("hex"),
		now + 60_000,
		now,
		now
	)

sqlite
	.query(
		`INSERT INTO recovery_code (id, user_id, code_hash, created_at)
		 VALUES (?, ?, ?, ?)`
	)
	.run(
		"recovery-row",
		userId,
		hashVerifier(recoveryCode.replaceAll("-", "")),
		now
	)

const testEnv = {
	AUTH_IP: { limit: async () => ({ success: true }) },
	COOKIE_SECRET: "test-cookie-secret-at-least-32-characters-long",
	TOTP_ENCRYPTION_KEY: totpKey
} as unknown as ApiEnv["Bindings"]

function app() {
	const api = new Hono<ApiEnv>()
	api.use("*", async (c, next) => {
		c.set("db", db)
		c.env = testEnv
		await next()
	})
	api.route("/", authRoutes)
	return api
}

function submit(code: string) {
	return app().request("/totp", {
		body: JSON.stringify({ code, ticket }),
		headers: { "content-type": "application/json" },
		method: "POST"
	})
}

function ticketIdentifier() {
	const row = sqlite
		.query(`SELECT identifier FROM verification WHERE id = ?`)
		.get("ticket-row") as { identifier: string } | null
	return row?.identifier ?? null
}

async function rejectWrongCode(attempt: number) {
	const response = await submit("wrong1")
	expect(response.status).toBe(401)
	expect(await response.text()).toBe("Incorrect authentication code")
	expect(ticketIdentifier()).toBe(`totp-login:${attempt}:${userId}`)
}

test("five wrong authenticator codes expire the sign-in ticket", async () => {
	expect(TOTP_MAX_ATTEMPTS).toBe(5)
	await rejectWrongCode(1)
	await rejectWrongCode(2)
	await rejectWrongCode(3)
	await rejectWrongCode(4)

	const expired = await submit("wrong1")
	expect(expired.status).toBe(401)
	expect(await expired.text()).toBe("That sign-in code expired. Try again.")
	expect(ticketIdentifier()).toBeNull()

	const correct = await submit(recoveryCode)
	expect(correct.status).toBe(401)
	expect(await correct.text()).toBe("That sign-in code expired. Try again.")

	const sessions = sqlite
		.query(`SELECT COUNT(*) AS count FROM session`)
		.get() as {
		count: number
	}
	expect(sessions.count).toBe(0)
})
