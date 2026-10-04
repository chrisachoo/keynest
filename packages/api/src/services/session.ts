import { createHash, randomBytes } from "node:crypto"

import { eq, session, user, type Database } from "@keynest/db"
import { SESSION_TTL_SECONDS, type UserPublicSchema } from "@keynest/shared"

import { toPublicUser } from "../lib/user"

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
	client: SessionClient
): Promise<string> {
	const token = generateSessionToken()

	await db.insert(session).values({
		expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
		ipAddress: client.ipAddress,
		token: hashToken(token),
		userAgent: client.userAgent,
		userId
	})

	return token
}

export async function findSession(
	db: Database,
	token: string
): Promise<{ sessionId: string; user: UserPublicSchema } | null> {
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

	return { sessionId: row.session.id, user: toPublicUser(row.user) }
}

export async function destroySession(
	db: Database,
	sessionId: string
): Promise<void> {
	await db.delete(session).where(eq(session.id, sessionId))
}
