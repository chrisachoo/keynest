import { expect, test } from "bun:test"

import { session } from "@keynest/db"
import { openMemoryDatabase } from "@keynest/db/memory"
import type { AuthSession } from "@keynest/shared"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { sessionRoutes } from "./sessions"

test("revoking other sessions needs no password and preserves the current and other users' sessions", async () => {
	const { db: memory } = openMemoryDatabase(`
		CREATE TABLE session (
			id text PRIMARY KEY,
			user_id text NOT NULL,
			token text NOT NULL UNIQUE,
			expires_at integer NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL,
			ip_address text,
			user_agent text
		);
	`)
	const db = memory as unknown as ApiEnv["Variables"]["db"]
	const now = new Date()
	await db.insert(session).values(
		[
			{ id: "current", userId: "user-a" },
			{ id: "other", userId: "user-a" },
			{ id: "another-user", userId: "user-b" }
		].map((item) => ({
			id: item.id,
			userId: item.userId,
			createdAt: now,
			expiresAt: now,
			token: item.id,
			updatedAt: now
		}))
	)

	function appFor(user: AuthSession | null, sessionId: string | null) {
		const app = new Hono<ApiEnv>()
		app.use("*", async (c, next) => {
			c.set("db", db)
			c.set("user", user)
			c.set("sessionId", sessionId)
			await next()
		})
		return app.route("/", sessionRoutes)
	}
	const env = {
		AUTH_SESSION: { limit: async () => ({ success: true }) }
	} as unknown as ApiEnv["Bindings"]

	const user = { id: "user-a" } as AuthSession
	const unauthenticated = await appFor(null, null).request(
		"/revoke-others",
		{ method: "POST" },
		env
	)
	expect(unauthenticated.status).toBe(401)
	const missingSession = await appFor(user, null).request(
		"/revoke-others",
		{ method: "POST" },
		env
	)
	expect(missingSession.status).toBe(401)
	expect(await db.select().from(session)).toHaveLength(3)

	const response = await appFor(user, "current").request(
		"/revoke-others",
		{ method: "POST" },
		env
	)
	expect(response.status).toBe(204)
	const remaining = await db.select().from(session)
	expect(remaining.map((item) => item.id).toSorted()).toEqual([
		"another-user",
		"current"
	])
})
