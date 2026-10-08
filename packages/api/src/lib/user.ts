import { and, eq, isNull, user, type Database } from "@keynest/db"
import { SALT_BYTES, type AuthSession } from "@keynest/shared"

import { internalError } from "./http"

type UserRow = typeof user.$inferSelect
type UserWithSalt = UserRow & { vaultSalt: string }

export function createVaultSalt() {
	return Buffer.from(
		crypto.getRandomValues(new Uint8Array(SALT_BYTES))
	).toString("base64url")
}

export async function ensureVaultSalt(
	db: Database,
	row: UserRow
): Promise<UserWithSalt> {
	if (row.vaultSalt) return { ...row, vaultSalt: row.vaultSalt }

	const vaultSalt = createVaultSalt()
	const [updated] = await db
		.update(user)
		.set({ vaultSalt })
		.where(and(eq(user.id, row.id), isNull(user.vaultSalt)))
		.returning()

	if (updated?.vaultSalt) return { ...updated, vaultSalt: updated.vaultSalt }

	const [current] = await db
		.select()
		.from(user)
		.where(eq(user.id, row.id))
		.limit(1)

	if (!current?.vaultSalt) throw internalError("Failed to store vault salt")
	return { ...current, vaultSalt: current.vaultSalt }
}

export function toAuthSession(row: UserWithSalt, expiresAt: Date): AuthSession {
	return {
		email: row.email,
		emailVerified: row.emailVerified,
		id: row.id,
		image: row.image,
		name: row.name,
		sessionExpiresAt: expiresAt.toISOString(),
		vaultSalt: row.vaultSalt
	}
}
