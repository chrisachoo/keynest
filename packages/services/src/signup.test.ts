import { expect, test } from "bun:test"

import type { Database } from "@keynest/db"
import { openMemoryDatabase } from "@keynest/db/memory"

import {
	applySignupEvent,
	handleSignupEvent,
	InvalidSignupEvent
} from "./signup"

const { db: memory, sqlite } = openMemoryDatabase(`
CREATE TABLE user (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	email text NOT NULL
);
CREATE TABLE notification (
	id text PRIMARY KEY NOT NULL,
	user_id text NOT NULL,
	kind text NOT NULL,
	title text NOT NULL,
	body text NOT NULL,
	created_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
`)
sqlite
	.query("INSERT INTO user (id, name, email) VALUES (?, ?, ?)")
	.run("user-a", "Ada", "ada@example.com")

const db = memory as Database
const env = {
	CORS_ORIGIN: "https://keynest.me",
	EMAIL_FROM: "Keynest <mail@keynest.me>",
	RESEND_API_KEY: "re_test"
}

function notificationCount() {
	const row = sqlite
		.query("SELECT count(*) AS count FROM notification")
		.get() as {
		count: number
	}
	return row.count
}

test("signup event sends the confirmation and records one notification", async () => {
	const bodies: string[] = []
	const original = globalThis.fetch
	globalThis.fetch = (async (_input, init) => {
		bodies.push(String(init?.body))
		return new Response("{}", { status: 200 })
	}) as typeof fetch

	try {
		const event = {
			email: "ada@example.com",
			token: "confirm-token",
			type: "user.signed_up" as const,
			userId: "user-a"
		}
		await applySignupEvent(db, env, event, "message-1")
		await applySignupEvent(db, env, event, "message-1")
	} finally {
		globalThis.fetch = original
	}

	expect(notificationCount()).toBe(1)
	expect(bodies).toHaveLength(2)
	expect(bodies[0]).toContain("confirm-token")
	expect(bodies[0]).toContain("https://keynest.me/verify-email")
	expect(bodies[0]).toContain('"html":')
	expect(bodies[0]).toContain("Confirm email")
})

test("an invalid signup event is rejected before delivery", async () => {
	await expect(
		handleSignupEvent(
			{ ...env, DB: {} as D1Database },
			{ type: "other" },
			"message-2"
		)
	).rejects.toBeInstanceOf(InvalidSignupEvent)
	expect(notificationCount()).toBe(1)
})
