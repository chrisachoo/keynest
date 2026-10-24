import { Database } from "bun:sqlite"

import { drizzle } from "drizzle-orm/bun-sqlite"

export function openMemoryDatabase(sql: string): {
	db: unknown
	sqlite: Database
} {
	const sqlite = new Database(":memory:")
	sqlite.run(sql)
	return { db: drizzle({ client: sqlite }), sqlite }
}
