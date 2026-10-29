import { createHmac } from "node:crypto"

import { account, and, eq, user, type Database } from "@keynest/db"
import {
	CREDENTIAL_PROVIDER,
	GOOGLE_PROVIDER,
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM,
	normalizeEmail,
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

/** AES-GCM wrap of the 32-byte data key: 48 bytes ciphertext, standard base64. */
const PLACEHOLDER_WRAP_BYTES = 48
/** GCM nonce length used by vault crypto. */
const PLACEHOLDER_NONCE_BYTES = 12

export function placeholderPrelogin(
	secret: string,
	email: string
): PreloginResult {
	const normalized = normalizeEmail(email)
	return {
		kdfIterations: KDF_ITERATIONS,
		kdfMemory: KDF_MEMORY_KIB,
		kdfParallelism: KDF_PARALLELISM,
		recoverySalt: digest(
			secret,
			`recovery-salt:${normalized}`,
			16,
			"base64url"
		),
		recoveryWrappedKey: digest(
			secret,
			`recovery-key:${normalized}`,
			PLACEHOLDER_WRAP_BYTES,
			"base64"
		),
		recoveryWrappedKeyNonce: digest(
			secret,
			`recovery-nonce:${normalized}`,
			PLACEHOLDER_NONCE_BYTES,
			"base64"
		),
		vaultSalt: digest(secret, `vault-salt:${normalized}`, 16, "base64url")
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

export function googleLoginIdentifier(userId: string, sub: string | null) {
	if (!sub) return `google-login:${userId}`
	return `google-login:${userId}:${Buffer.from(sub).toString("base64url")}`
}

export function parseGoogleLogin(identifier: string) {
	const prefix = "google-login:"
	if (!identifier.startsWith(prefix)) return null
	const rest = identifier.slice(prefix.length)
	const split = rest.indexOf(":")
	if (split < 0) return rest ? { sub: null, userId: rest } : null
	const userId = rest.slice(0, split)
	const sub = Buffer.from(rest.slice(split + 1), "base64url").toString("utf8")
	if (!userId || !sub) return null
	return { sub, userId }
}

export function totpLoginIdentifier(
	attempts: number,
	userId: string,
	googleSub: string | null
) {
	const base = `totp-login:${attempts}:${userId}`
	if (!googleSub) return base
	return `${base}:google:${Buffer.from(googleSub).toString("base64url")}`
}

export function parseTotpLogin(identifier: string) {
	const match = /^totp-login:(\d+):([^:]+)(?::google:([A-Za-z0-9_-]+))?$/.exec(
		identifier
	)
	if (!match?.[2]) return null
	const attempts = Number(match[1])
	if (!Number.isInteger(attempts)) return null
	const googleSub = match[3]
		? Buffer.from(match[3], "base64url").toString("utf8")
		: null
	if (match[3] && !googleSub) return null
	return { attempts, googleSub, userId: match[2] }
}

export async function linkGoogleAccount(
	db: Database,
	userId: string,
	sub: string
) {
	try {
		await db.insert(account).values({
			accountId: sub,
			providerId: GOOGLE_PROVIDER,
			userId
		})
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("UNIQUE constraint failed")
		)
			return
		throw error
	}
}

function digest(
	secret: string,
	label: string,
	size: number,
	encoding: "base64" | "base64url"
) {
	const bytes = Buffer.alloc(size)
	let offset = 0
	let counter = 0

	while (offset < size) {
		const block = createHmac("sha256", secret)
			.update(`${label}:${counter}`)
			.digest()
		const take = Math.min(block.length, size - offset)
		bytes.set(block.subarray(0, take), offset)
		offset += take
		counter += 1
	}

	return bytes.toString(encoding)
}
