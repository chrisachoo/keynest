import { createHash, randomBytes } from "node:crypto"

import { eq, verification, type Database } from "@keynest/db"

function hashToken(token: string) {
	return createHash("sha256").update(token).digest("hex")
}

export async function issueToken(
	db: Database,
	identifier: string,
	ttlMs: number
) {
	const token = Buffer.from(randomBytes(32)).toString("base64url")
	await db.delete(verification).where(eq(verification.identifier, identifier))
	await db.insert(verification).values({
		expiresAt: new Date(Date.now() + ttlMs),
		identifier,
		value: hashToken(token)
	})
	return token
}

export async function readToken(db: Database, token: string) {
	const [row] = await db
		.select()
		.from(verification)
		.where(eq(verification.value, hashToken(token)))
		.limit(1)

	if (!row) return null
	if (Date.now() >= row.expiresAt.getTime()) {
		await db.delete(verification).where(eq(verification.id, row.id))
		return null
	}
	return row
}

export async function deleteToken(db: Database, id: string) {
	await db.delete(verification).where(eq(verification.id, id))
}

export async function replaceTokenIdentifier(
	db: Database,
	id: string,
	identifier: string
) {
	await db
		.update(verification)
		.set({ identifier })
		.where(eq(verification.id, id))
}

export function emailChangeIdentifier(userId: string, email: string) {
	return `change-email:${userId}:${Buffer.from(email).toString("base64url")}`
}

export function parseEmailChange(identifier: string) {
	const prefix = "change-email:"
	if (!identifier.startsWith(prefix)) return null

	const rest = identifier.slice(prefix.length)
	const split = rest.indexOf(":")

	if (split < 0) return null

	return {
		email: Buffer.from(rest.slice(split + 1), "base64url").toString("utf8"),
		userId: rest.slice(0, split)
	}
}
