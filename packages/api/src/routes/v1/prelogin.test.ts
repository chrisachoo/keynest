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
		"user-a",
		"ada@example.com",
		"Ada",
		"vault-salt-value-here12",
		KDF_MEMORY_KIB,
		KDF_ITERATIONS,
		KDF_PARALLELISM,
		"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"AAAAAAAAAAAAAA==",
		"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"AAAAAAAAAAAAAA==",
		"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"AAAAAAAAAAAAAA==",
		"recovery-salt-value-here12",
		Date.now(),
		Date.now()
	)

const testEnv = {
	AUTH_ACCOUNT: { limit: async () => ({ success: true }) },
	AUTH_IP: { limit: async () => ({ success: true }) },
	COOKIE_SECRET: "test-cookie-secret-at-least-32-characters-long"
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

test("prelogin resolves email case-insensitively", async () => {
	const response = await app().request("/prelogin", {
		body: JSON.stringify({ email: "Ada@Example.com" }),
		headers: { "content-type": "application/json" },
		method: "POST"
	})
	expect(response.status).toBe(200)
	const body = (await response.json()) as { vaultSalt: string }
	expect(body.vaultSalt).toBe("vault-salt-value-here12")
})

test("unknown and known prelogin use the same recovery wrap lengths", async () => {
	const known = await app().request("/prelogin", {
		body: JSON.stringify({ email: "ada@example.com" }),
		headers: { "content-type": "application/json" },
		method: "POST"
	})
	const unknown = await app().request("/prelogin", {
		body: JSON.stringify({ email: "missing@example.com" }),
		headers: { "content-type": "application/json" },
		method: "POST"
	})
	const knownBody = (await known.json()) as {
		recoveryWrappedKey: string
		recoveryWrappedKeyNonce: string
	}
	const unknownBody = (await unknown.json()) as {
		recoveryWrappedKey: string
		recoveryWrappedKeyNonce: string
	}
	expect(unknownBody.recoveryWrappedKey.length).toBe(
		knownBody.recoveryWrappedKey.length
	)
	expect(unknownBody.recoveryWrappedKeyNonce.length).toBe(
		knownBody.recoveryWrappedKeyNonce.length
	)
})
