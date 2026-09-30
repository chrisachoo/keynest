import { userPublic } from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { jsonContent, unauthorizedResponse } from "../../lib/openapi"
import { getAuthUser, requireAuth } from "../../middleware/auth"

export const usersRoutes = new Hono<ApiEnv>().get(
	"/me",
	describeRoute({
		description:
			"Return the authenticated account. Session/OAuth is not wired yet.",
		responses: {
			200: jsonContent(userPublic, "Current user"),
			401: unauthorizedResponse
		},
		security: [{ SessionCookie: [] }],
		summary: "Current user",
		tags: ["Users"]
	}),
	requireAuth,
	(c) => c.json(getAuthUser(c))
)
