import { SESSION_COOKIE_NAME } from "@keynest/shared"
import { Scalar } from "@scalar/hono-api-reference"
import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { HTTPException } from "hono/http-exception"

import type { ApiEnv } from "./env"
import { withDb } from "./middleware/db"
import { healthRoutes } from "./routes/health"
import { v1 } from "./routes/v1"

export const api = new Hono<ApiEnv>()

api.onError((err, c) => {
	if (err instanceof HTTPException)
		return c.json({ message: err.message }, err.status)

	return c.json({ message: "Internal server error" }, 500)
})

api.use("*", withDb)
api.route("/health", healthRoutes)
api.route("/v1", v1)

api.get(
	"/openapi.json",
	openAPIRouteHandler(v1, {
		documentation: {
			components: {
				securitySchemes: {
					SessionCookie: {
						in: "cookie",
						name: SESSION_COOKIE_NAME,
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
