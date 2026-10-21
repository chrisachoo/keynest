import { MailDeliveryError } from "@keynest/services/mail"
import { SESSION_COOKIE } from "@keynest/shared"
import { Scalar } from "@scalar/hono-api-reference"
import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { HTTPException } from "hono/http-exception"

import type { ApiEnv } from "./env"
import { recordError } from "./lib/report"
import { withDb } from "./middleware/db"
import { healthRoutes } from "./routes/health"
import { v1 } from "./routes/v1"

export const api = new Hono<ApiEnv>()

api.onError((err, c) => {
	if (!(err instanceof HTTPException) || err.status >= 500) {
		const message = err instanceof Error ? err.message : "Internal server error"
		const write = recordError(c.env.DB, "server", message).catch(
			() => undefined
		)
		c.executionCtx?.waitUntil(write)
	}

	if (err instanceof HTTPException)
		return c.json({ message: err.message }, err.status)
	if (err instanceof MailDeliveryError)
		return c.json({ message: err.message }, 500)

	return c.json({ message: "Internal server error" }, 500)
})

api.use("*", withDb)
api.route("/health", healthRoutes)
api.route("/v1", v1)

function localDocs(url: string) {
	const host = new URL(url).hostname
	return host === "localhost" || host === "127.0.0.1"
}

api.use("/openapi.json", async (c, next) => {
	if (!localDocs(c.req.url)) return c.json({ message: "Not found" }, 404)
	await next()
})

api.use("/docs", async (c, next) => {
	if (!localDocs(c.req.url)) return c.json({ message: "Not found" }, 404)
	await next()
})

api.get(
	"/openapi.json",
	openAPIRouteHandler(v1, {
		documentation: {
			components: {
				securitySchemes: {
					SessionCookie: {
						in: "cookie",
						name: SESSION_COOKIE,
						type: "apiKey"
					}
				}
			},
			info: {
				description:
					"Keynest API. Vault payloads are client-encrypted; the server stores ciphertext only.",
				title: "Keynest API",
				version: "1.0.0"
			},
			servers: [{ description: "API v1", url: "/api/v1" }],
			tags: [
				{ description: "Sign up, log in, and log out", name: "Auth" },
				{ description: "Authenticated account", name: "Users" },
				{
					description: "Encrypted vault items. Never plaintext secrets.",
					name: "Vault items"
				}
			]
		}
	})
)

api.get(
	"/docs",
	Scalar({
		pageTitle: "Keynest API",
		url: "/api/openapi.json"
	})
)

export type { ApiEnv } from "./env"
export type ApiType = typeof v1
export type AppType = typeof healthRoutes
