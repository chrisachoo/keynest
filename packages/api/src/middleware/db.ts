import { createDb } from "@keynest/db"
import { createMiddleware } from "hono/factory"

import type { ApiEnv } from "../env"

export const withDb = createMiddleware<ApiEnv>(async (c, next) => {
	c.set("db", createDb(c.env.DB))
	c.set("user", null)
	await next()
})
