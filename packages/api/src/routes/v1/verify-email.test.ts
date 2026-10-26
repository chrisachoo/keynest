import { expect, test } from "bun:test"
import { createHash } from "node:crypto"

import { openMemoryDatabase } from "@keynest/db/memory"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { authRoutes } from "./auth"

const { db: memory, sqlite } = openMemoryDatabase(`
CREATE TABLE user (
	id text PRIMARY KEY,
	email text NOT NULL,
	name text NOT NULL,
	email_verified integer DEFAULT 0 NOT NULL,
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
CREATE TABLE session (
	id text PRIMARY KEY,
	token text NOT NULL UNIQUE,
	user_id text NOT NULL,
	expires_at integer NOT NULL,
	created_at integer,
	updated_at integer
);
`)

const db = memory as unknown as ApiEnv["Variables"]["db"]
const token = "verify-email-token-value-for-test-purposes-only"

sqlite
	.query(
		`INSERT INTO user (id, email, name, email_verified) VALUES (?, ?, ?, 0)`
	)
	.run("user-a", "ada@example.com", "Ada")

sqlite
	.query(
		`INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	)
	.run(
		"verify-row",
		"verify-email:user-a",
		createHash("sha256").update(token).digest("hex"),
		Date.now() + 60_000,
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

test("verify-email confirms the address without creating a session", async () => {
	const response = await app().request("/verify-email", {
		body: JSON.stringify({ token }),
		headers: { "content-type": "application/json" },
		method: "POST"
	})
	expect(response.status).toBe(200)
	expect(await response.json()).toEqual({ verified: true })
	const cookie = response.headers.get("set-cookie") ?? ""
	expect(cookie.includes("Max-Age=0") || cookie.length === 0).toBe(true)

	const row = sqlite
		.query(`SELECT email_verified FROM user WHERE id = ?`)
		.get("user-a") as { email_verified: number }
	expect(row.email_verified).toBe(1)

	const sessions = sqlite
		.query(`SELECT COUNT(*) AS count FROM session`)
		.get() as {
		count: number
	}
	expect(sessions.count).toBe(0)
})
