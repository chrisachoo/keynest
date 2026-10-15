import { createHmac } from "node:crypto"

import { account, and, eq, user, type Database } from "@keynest/db"
import {
	CREDENTIAL_PROVIDER,
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM,
	type AuthSession,
	type PreloginResult
} from "@keynest/shared"

type UserRow = typeof user.$inferSelect

export type VaultUser = UserRow & {
	kdfIterations: number
	kdfMemory: number
	kdfParallelism: number
	keyCheck: string
	keyCheckNonce: string
	vaultSalt: string
	wrappedKey: string
	wrappedKeyNonce: string
}

export function readVaultUser(row: UserRow): VaultUser | null {
	if (
		row.kdfIterations === null ||
		row.kdfMemory === null ||
		row.kdfParallelism === null ||
		!row.keyCheck ||
		!row.keyCheckNonce ||
		!row.vaultSalt ||
		!row.wrappedKey ||
		!row.wrappedKeyNonce
	) {
		return null
	}

	return {
		...row,
		kdfIterations: row.kdfIterations,
		kdfMemory: row.kdfMemory,
		kdfParallelism: row.kdfParallelism,
		keyCheck: row.keyCheck,
		keyCheckNonce: row.keyCheckNonce,
		vaultSalt: row.vaultSalt,
		wrappedKey: row.wrappedKey,
		wrappedKeyNonce: row.wrappedKeyNonce
	}
}

export function readPrelogin(row: UserRow): PreloginResult | null {
	const vault = readVaultUser(row)
	if (
		!vault ||
		!row.recoverySalt ||
		!row.recoveryWrappedKey ||
		!row.recoveryWrappedKeyNonce
	) {
		return null
	}

	return {
		kdfIterations: vault.kdfIterations,
		kdfMemory: vault.kdfMemory,
		kdfParallelism: vault.kdfParallelism,
		recoverySalt: row.recoverySalt,
		recoveryWrappedKey: row.recoveryWrappedKey,
		recoveryWrappedKeyNonce: row.recoveryWrappedKeyNonce,
		vaultSalt: vault.vaultSalt
	}
}

export function toAuthSession(row: VaultUser, expiresAt: Date): AuthSession {
	return {
		email: row.email,
		emailVerified: row.emailVerified,
		id: row.id,
		image: row.image,
		kdfIterations: row.kdfIterations,
		kdfMemory: row.kdfMemory,
		kdfParallelism: row.kdfParallelism,
		keyCheck: row.keyCheck,
		keyCheckNonce: row.keyCheckNonce,
		name: row.name,
		sessionExpiresAt: expiresAt.toISOString(),
		totpEnabled: row.totpEnabled,
		vaultSalt: row.vaultSalt,
		wrappedKey: row.wrappedKey,
		wrappedKeyNonce: row.wrappedKeyNonce
	}
}

export function placeholderPrelogin(
	secret: string,
	email: string
): PreloginResult {
	return {
		kdfIterations: KDF_ITERATIONS,
		kdfMemory: KDF_MEMORY_KIB,
		kdfParallelism: KDF_PARALLELISM,
		recoverySalt: digest(secret, `recovery-salt:${email}`, 16, "base64url"),
		recoveryWrappedKey: digest(secret, `recovery-key:${email}`, 32, "base64"),
		recoveryWrappedKeyNonce: digest(
			secret,
			`recovery-nonce:${email}`,
			12,
			"base64"
		),
		vaultSalt: digest(secret, `vault-salt:${email}`, 16, "base64url")
	}
}

export async function storedVerifier(db: Database, userId: string) {
	const [row] = await db
		.select({ password: account.password })
		.from(account)
		.where(
			and(
				eq(account.userId, userId),
				eq(account.providerId, CREDENTIAL_PROVIDER)
			)
		)
		.limit(1)

	return row?.password ?? null
}

function digest(
	secret: string,
	label: string,
	size: number,
	encoding: "base64" | "base64url"
) {
	const bytes = createHmac("sha256", secret)
		.update(label)
		.digest()
		.subarray(0, size)
	return Buffer.from(bytes).toString(encoding)
}
