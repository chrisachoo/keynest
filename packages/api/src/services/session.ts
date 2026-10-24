import { createHash, randomBytes } from "node:crypto"

import { and, eq, ne, session, user, type Database } from "@keynest/db"
import { SESSION_TTL_SECONDS, type AuthSession } from "@keynest/shared"

import { readVaultUser, toAuthSession } from "../lib/user"

export type SessionClient = {
	ipAddress: string | null
	userAgent: string | null
}

function generateSessionToken(): string {
	return Buffer.from(randomBytes(32)).toString("base64url")
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex")
}

export async function createSession(
	db: Database,
	userId: string,
	client: SessionClient,
	ttlSeconds = SESSION_TTL_SECONDS
): Promise<{ expiresAt: Date; token: string }> {
	const token = generateSessionToken()
	const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

	await db.insert(session).values({
		expiresAt,
		ipAddress: client.ipAddress,
		token: hashToken(token),
		userAgent: client.userAgent,
		userId
	})

	return { expiresAt, token }
}

export async function findSession(
	db: Database,
	token: string
): Promise<{ sessionId: string; user: AuthSession } | null> {
	const [row] = await db
		.select()
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.token, hashToken(token)))
		.limit(1)

	if (!row) return null

	if (Date.now() >= row.session.expiresAt.getTime()) {
		await db.delete(session).where(eq(session.id, row.session.id))
		return null
	}

	const stored = readVaultUser(row.user)
	if (!stored) {
		await db.delete(session).where(eq(session.id, row.session.id))
		return null
	}

	return {
		sessionId: row.session.id,
		user: toAuthSession(stored, row.session.expiresAt)
	}
}

export async function destroySession(
	db: Database,
	sessionId: string
): Promise<void> {
	await db.delete(session).where(eq(session.id, sessionId))
}

export async function destroyUserSessions(
	db: Database,
	userId: string,
	exceptId?: string
): Promise<void> {
	await db
		.delete(session)
		.where(
			exceptId
				? and(eq(session.userId, userId), ne(session.id, exceptId))
				: eq(session.userId, userId)
		)
}

export async function listSessions(
	db: Database,
	userId: string,
	currentId: string | null
) {
	const rows = await db.select().from(session).where(eq(session.userId, userId))

	return rows.map((row) => ({
		createdAt: row.createdAt.toISOString(),
		current: row.id === currentId,
		expiresAt: row.expiresAt.toISOString(),
		id: row.id,
		ipAddress: row.ipAddress,
		userAgent: row.userAgent
	}))
}
