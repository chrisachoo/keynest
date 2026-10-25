import { expect, test } from "bun:test"

import { vaultItem } from "@keynest/db"
import { openMemoryDatabase } from "@keynest/db/memory"
import type { AuthSession } from "@keynest/shared"
import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { vaultItemRoutes } from "./vault-items"

const { db: memory } = openMemoryDatabase(`
CREATE TABLE vault_item (
	id text PRIMARY KEY,
	user_id text NOT NULL,
	type text NOT NULL,
	ciphertext text NOT NULL,
	nonce text NOT NULL,
	favorite integer DEFAULT 0 NOT NULL,
	created_at integer NOT NULL,
	updated_at integer NOT NULL
);
`)

const db = memory as unknown as ApiEnv["Variables"]["db"]
const now = new Date()

await db.insert(vaultItem).values([
	{
		ciphertext: "cipher-a",
		createdAt: now,
		favorite: false,
		id: "item-a",
		nonce: "nonce-a",
		type: "login",
		updatedAt: now,
		userId: "user-a"
	},
	{
		ciphertext: "cipher-b",
		createdAt: new Date(now.getTime() + 1),
		favorite: false,
		id: "item-b",
		nonce: "nonce-b",
		type: "secure_note",
		updatedAt: now,
		userId: "user-b"
	}
])

function session(id: string): AuthSession {
	return {
		email: `${id}@example.com`,
		emailVerified: true,
		id,
		image: null,
		kdfIterations: 3,
		kdfMemory: 65536,
		kdfParallelism: 1,
		keyCheck: "check",
		keyCheckNonce: "check-nonce",
		name: id,
		sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
		totpEnabled: false,
		vaultSalt: "vault-salt-value-here",
		wrappedKey: "wrapped",
		wrappedKeyNonce: "wrapped-nonce"
	}
}

const testEnv = {
	AUTH_SESSION: { limit: async () => ({ success: true }) }
} as unknown as ApiEnv["Bindings"]

function appFor(userId: string) {
	const app = new Hono<ApiEnv>()
	app.use("*", async (c, next) => {
		c.set("db", db as unknown as ApiEnv["Variables"]["db"])
		c.set("sessionId", "session")
		c.set("user", session(userId))
		await next()
	})
	return app.route("/", vaultItemRoutes)
}

function request(app: Hono<ApiEnv>, path: string, init?: RequestInit) {
	return app.request(path, init, testEnv)
}

test("one user cannot read, list, update, or delete another user's vault item", async () => {
	const reader = appFor("user-a")

	const hidden = await request(reader, "/item-b")
	expect(hidden.status).toBe(404)

	const own = await request(reader, "/item-a")
	expect(own.status).toBe(200)
	expect(await own.json()).toMatchObject({
		ciphertext: "cipher-a",
		id: "item-a",
		userId: "user-a"
	})

	const list = await request(reader, "/")
	expect(list.status).toBe(200)
	const body = (await list.json()) as { items: { id: string }[] }
	expect(body.items.map((item) => item.id)).toEqual(["item-a"])

	const patched = await request(reader, "/item-b", {
		body: JSON.stringify({ favorite: true }),
		headers: { "content-type": "application/json" },
		method: "PATCH"
	})
	expect(patched.status).toBe(404)

	const removed = await request(reader, "/item-b", { method: "DELETE" })
	expect(removed.status).toBe(404)

	const owner = await request(appFor("user-b"), "/item-b")
	expect(owner.status).toBe(200)
	expect(await owner.json()).toMatchObject({ ciphertext: "cipher-b" })
})

test("limit=0 is clamped to one item instead of returning an empty page", async () => {
	const list = await request(appFor("user-a"), "/?limit=0")
	expect(list.status).toBe(200)
	const body = (await list.json()) as { items: { id: string }[] }
	expect(body.items.map((item) => item.id)).toEqual(["item-a"])
})
