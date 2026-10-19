import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const errorReport = sqliteTable("error_report", {
	id: text("id").primaryKey(),
	source: text("source", { enum: ["client", "server"] }).notNull(),
	message: text("message").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
})
