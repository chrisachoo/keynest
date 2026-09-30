import { VAULT_ITEM_TYPES } from "@keynest/shared"
import { createId } from "@paralleldrive/cuid2"
import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { user } from "./auth"

export const vaultItem = sqliteTable(
	"vault_item",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type", { enum: VAULT_ITEM_TYPES }).notNull(),
		ciphertext: text("ciphertext").notNull(),
		nonce: text("nonce").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [
		index("vault_item_userId_idx").on(table.userId),
		index("vault_item_userId_type_idx").on(table.userId, table.type)
	]
)
