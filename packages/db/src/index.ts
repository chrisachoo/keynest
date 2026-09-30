/// <reference types="@cloudflare/workers-types" />
import { drizzle } from "drizzle-orm/d1"

import { dbRelations } from "./schema/relations"

export function createDb(d1: D1Database) {
	return drizzle(d1, { relations: dbRelations })
}

export type Database = ReturnType<typeof createDb>
export { and, eq } from "drizzle-orm"
export * from "./schema"
