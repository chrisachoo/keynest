import { createMiddleware } from "hono/factory"

import type { ApiEnv } from "../env"
import { forbidden } from "../lib/http"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export const requireSameOrigin = createMiddleware<ApiEnv>(async (c, next) => {
	if (SAFE_METHODS.has(c.req.method)) {
		await next()
		return
	}

	const allowed = new URL(c.env.CORS_ORIGIN).origin
	if (c.req.header("origin") !== allowed) throw forbidden()

	await next()
})
