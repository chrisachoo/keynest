import { expect, test } from "bun:test"

import { openMemoryDatabase } from "@keynest/db/memory"
import {
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM
} from "@keynest/shared"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { authRoutes } from "./auth"

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
	created_at integer,
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

sqlite
	.query(
		`INSERT INTO user (
			id, email, name, email_verified, vault_salt, kdf_memory, kdf_iterations,
			kdf_parallelism, wrapped_key, wrapped_key_nonce, key_check, key_check_nonce,
			recovery_wrapped_key, recovery_wrapped_key_nonce, recovery_salt,
			created_at, updated_at
		) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
	.run(
		"existing-user",
		"existing@example.com",
		"Existing",
		"salt",
		KDF_MEMORY_KIB,
		KDF_ITERATIONS,
		KDF_PARALLELISM,
		"wrap",
		"wrap-nonce",
		"check",
		"check-nonce",
		"recovery-wrap",
		"recovery-nonce",
		"recovery-salt",
		Date.now(),
		Date.now()
	)

const testEnv = {
	AUTH_ACCOUNT: { limit: async () => ({ success: true }) },
	AUTH_IP: { limit: async () => ({ success: true }) },
	COOKIE_SECRET: "test-cookie-secret-at-least-32-characters-long",
	EVENTS: { send: async () => undefined }
} as unknown as ApiEnv["Bindings"]

function app() {
	const app = new Hono<ApiEnv>()
	app.use("*", async (c, next) => {
		c.set("db", db)
		c.env = testEnv
		await next()
	})
	app.route("/", authRoutes)
	return app
}

function signupBody(email: string) {
	const wrap =
		"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	const nonce = "AAAAAAAAAAAAAA=="
	return {
		email,
		keyCheck: wrap,
		keyCheckNonce: nonce,
		name: "Test User",
		recoverySalt: "AAAAAAAAAAAAAAAAAAAAAA",
		recoveryVerifier: "c".repeat(43),
		recoveryWrappedKey: wrap,
		recoveryWrappedKeyNonce: nonce,
		vaultSalt: "AAAAAAAAAAAAAAAAAAAAAA",
		verifier: "d".repeat(43),
		wrappedKey: wrap,
		wrappedKeyNonce: nonce
	}
}

test("signup for an existing email reports created false", async () => {
	const response = await app().request("/signup", {
		body: JSON.stringify(signupBody("existing@example.com")),
		headers: { "content-type": "application/json" },
		method: "POST"
	})
	expect(response.status).toBe(200)
	expect(await response.json()).toEqual({ created: false, status: "accepted" })
})
