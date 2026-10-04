import { createMiddleware } from "hono/factory"

import type { ApiEnv } from "../env"
import { forbidden } from "../lib/http"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export const requireSameOrigin = createMiddleware<ApiEnv>(async (c, next) => {
	if (SAFE_METHODS.has(c.req.method)) {
		await next()
		return
	}

	if (c.req.header("origin") !== c.env.CORS_ORIGIN) throw forbidden()

	await next()
})
