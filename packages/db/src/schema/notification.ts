import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { user } from "./auth"

export const NOTIFICATION_KINDS = ["signup", "signup_existing"] as const

export const notification = sqliteTable(
	"notification",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		kind: text("kind", { enum: NOTIFICATION_KINDS }).notNull(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull()
	},
	(table) => [index("notification_userId_idx").on(table.userId)]
)
