import { ErrorReportInputSchema } from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { TOO_MANY_REQUESTS } from "../../lib/openapi"
import { enforceErrorIp } from "../../lib/rate-limit"
import { recordError } from "../../lib/report"

export const errorRoutes = new Hono<ApiEnv>().post(
	"/",
	describeRoute({
		description:
			"Store a short client error. The body is redacted and truncated. Passwords, verifiers, and vault ciphertext are not kept.",
		responses: {
			204: { description: "Stored" },
			429: TOO_MANY_REQUESTS,
			503: { description: "Error report was not saved" }
		},
		summary: "Report a client error",
		tags: ["Diagnostics"]
	}),
	validator("json", ErrorReportInputSchema),
	async (c) => {
		await enforceErrorIp(c)
		const { message } = c.req.valid("json")

		try {
			await recordError(c.env.DB, "client", message)
		} catch {
			return c.json({ message: "Error report was not saved" }, 503)
		}

		return c.body(null, 204)
	}
)
