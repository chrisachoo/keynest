import { api } from "@keynest/api"
import { type Context, Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { requestId } from "hono/request-id"
import { timeout } from "hono/timeout"

import type { CloudflareEnv } from "../cloudflare-env.d.ts"
import { createServerEnv } from "./env"

const app = new Hono<{ Bindings: CloudflareEnv }>({ strict: true })
	.basePath("/api")
	.use("*", async (c: Context<{ Bindings: CloudflareEnv }>, next) => {
		const { CORS_ORIGIN } = createServerEnv(c.env)

		return cors({
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			origin: CORS_ORIGIN
		})(c, next)
	})
	.use(logger())
	.use(requestId())
	.use(timeout(5000))
	.route("/", api)

export default app
