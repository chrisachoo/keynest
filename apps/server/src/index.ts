import { api } from "@keynest/api"
import { type Context, Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { requestId } from "hono/request-id"
import { secureHeaders } from "hono/secure-headers"
import { timeout } from "hono/timeout"

import type { CloudflareEnv } from "../cloudflare-env.d.ts"
import { createServerEnv } from "./env"

const app = new Hono<{ Bindings: CloudflareEnv }>({ strict: true })
	.basePath("/api")
	.use("*", async (c: Context<{ Bindings: CloudflareEnv }>, next) => {
		const { CORS_ORIGIN } = createServerEnv(c.env)

		return cors({
			allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			origin: CORS_ORIGIN
		})(c, next)
	})
	.use("*", async (c, next) => {
		const host = new URL(c.req.url).hostname
		if (host !== "localhost" && host !== "127.0.0.1") return next()
		return logger()(c, next)
	})
	.use(requestId())
	.use(timeout(5000))
	.use(
		secureHeaders({
			contentSecurityPolicy: {
				baseUri: ["'none'"],
				defaultSrc: ["'none'"],
				frameAncestors: ["'none'"]
			},
			crossOriginResourcePolicy: "cross-origin",
			permissionsPolicy: {
				camera: [],
				geolocation: [],
				microphone: []
			},
			referrerPolicy: "no-referrer",
			xFrameOptions: "DENY"
		})
	)
	.route("/", api)

export default app
