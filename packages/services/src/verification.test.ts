import { expect, test } from "bun:test"

import type { Database } from "@keynest/db"
import { openMemoryDatabase } from "@keynest/db/memory"

import { replaceTokenIdentifier } from "./verification"

function createDatabase() {
	const { db, sqlite } = openMemoryDatabase(`
		CREATE TABLE verification (
			id text PRIMARY KEY,
			identifier text NOT NULL,
			value text NOT NULL,
			expires_at integer NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		);
	`)
	sqlite
		.query(
			`INSERT INTO verification
				(id, identifier, value, expires_at, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run("ticket-a", "totp-login:0:user-a", "token-hash", 1, 1, 1)

	return { db: db as Database, sqlite }
}

test("only one concurrent request can advance a TOTP ticket attempt", async () => {
	const { db, sqlite } = createDatabase()
	const results = await Promise.all([
		replaceTokenIdentifier(
			db,
			"ticket-a",
			"totp-login:0:user-a",
			"totp-login:1:user-a"
		),
		replaceTokenIdentifier(
			db,
			"ticket-a",
			"totp-login:0:user-a",
			"totp-login:1:user-a"
		)
	])
	const row = sqlite
		.query("SELECT identifier FROM verification WHERE id = ?")
		.get("ticket-a") as { identifier: string }

	expect(results.toSorted()).toEqual([false, true])
	expect(row.identifier).toBe("totp-login:1:user-a")
})
