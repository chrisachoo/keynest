import { expect, test } from "bun:test"

import { notification } from "@keynest/db"
import { openMemoryDatabase } from "@keynest/db/memory"
import type { AuthSession } from "@keynest/shared"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { notificationRoutes } from "./notifications"

const { db: memory } = openMemoryDatabase(`
CREATE TABLE notification (
	id text PRIMARY KEY,
	user_id text NOT NULL,
	kind text NOT NULL,
	title text NOT NULL,
	body text NOT NULL,
	created_at integer NOT NULL
);
`)

const db = memory as unknown as ApiEnv["Variables"]["db"]

await db.insert(notification).values([
	{
		body: "old",
		createdAt: new Date(1000),
		id: "n-old",
		kind: "signup",
		title: "Old",
		userId: "user-a"
	},
	{
		body: "new",
		createdAt: new Date(2000),
		id: "n-new",
		kind: "signup_existing",
		title: "New",
		userId: "user-a"
	},
	{
		body: "other",
		createdAt: new Date(3000),
		id: "n-other",
		kind: "signup",
		title: "Other",
		userId: "user-b"
	}
])

const testEnv = {
	AUTH_SESSION: { limit: async () => ({ success: true }) }
} as unknown as ApiEnv["Bindings"]

function appFor(userId: string | null) {
	const app = new Hono<ApiEnv>()
	app.use("*", async (c, next) => {
		c.set("db", db)
		c.set("sessionId", "session")
		if (userId) c.set("user", { id: userId } as AuthSession)
		await next()
	})
	return app.route("/", notificationRoutes)
}

test("lists only the current user's notifications, newest first", async () => {
	const response = await appFor("user-a").request("/", undefined, testEnv)
	expect(response.status).toBe(200)
	const body = (await response.json()) as { notifications: { id: string }[] }
	expect(body.notifications.map((item) => item.id)).toEqual(["n-new", "n-old"])
})

test("rejects unauthenticated requests", async () => {
	const response = await appFor(null).request("/", undefined, testEnv)
	expect(response.status).toBe(401)
})
