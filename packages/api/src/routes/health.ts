import { disconnected, HealthResponseSchema } from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute } from "hono-openapi"

import type { ApiEnv } from "../env"
import { jsonContent } from "../lib/openapi"

export const healthRoutes = new Hono<ApiEnv>().get(
	"/",
	describeRoute({
		description: "Service liveness check.",
		responses: {
			200: jsonContent(HealthResponseSchema, "API is running")
		},
		summary: "Health check",
		tags: ["Health"]
	}),
	async (c) => {
		try {
			await c.env.DB.prepare("SELECT 1").run()
		} catch {
			return c.json(
				disconnected(HealthResponseSchema, "Database is unavailable"),
				503
			)
		}

		return c.json({
			message: "API is running",
			ok: true as const,
			timestamp: new Date().toISOString()
		})
	}
)
