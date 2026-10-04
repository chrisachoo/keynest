import type { user } from "@keynest/db"
import type { UserPublicSchema } from "@keynest/shared"

type UserRow = typeof user.$inferSelect

export function toPublicUser(row: UserRow): UserPublicSchema {
	return {
		email: row.email,
		emailVerified: row.emailVerified,
		id: row.id,
		image: row.image,
		name: row.name
	}
}
