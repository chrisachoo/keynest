import type { UserPublicSchema } from "@keynest/shared"
import type { Context } from "hono"
import { createMiddleware } from "hono/factory"

import type { ApiEnv } from "../env"
import { unauthorized } from "../lib/http"
import { clearSessionCookie, readSessionCookie } from "../services/cookie"
import { findSession } from "../services/session"

export const loadSession = createMiddleware<ApiEnv>(async (c, next) => {
	const token = await readSessionCookie(c)

	if (!token) {
		c.set("user", null)
		c.set("sessionId", null)
		await next()
		return
	}

	const found = await findSession(c.get("db"), token)

	if (!found) {
		clearSessionCookie(c)
		c.set("user", null)
		c.set("sessionId", null)
		await next()
		return
	}

	c.set("user", found.user)
	c.set("sessionId", found.sessionId)
	await next()
})

export const requireAuth = createMiddleware<ApiEnv>(async (c, next) => {
	if (!c.get("user")) throw unauthorized()
	await next()
})

export function getAuthUser(c: Context<ApiEnv>): UserPublicSchema {
	const current = c.get("user")
	if (!current) throw unauthorized()
	return current
}
