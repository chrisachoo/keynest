import type { UserPublic } from "@keynest/shared"
import type { Context } from "hono"
import { createMiddleware } from "hono/factory"

import type { ApiEnv } from "../env"
import { unauthorized } from "../lib/http"

export const requireAuth = createMiddleware<ApiEnv>(async (c, next) => {
	if (!c.get("user")) throw unauthorized()

	await next()
})

export function getAuthUser(c: Context<ApiEnv>): UserPublic {
	const user = c.get("user")
	if (!user) throw unauthorized()

	return user
}
