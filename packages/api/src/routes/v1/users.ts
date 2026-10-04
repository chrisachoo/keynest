import { UserPublicSchema } from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { jsonContent, UNAUTHORIZED_RESPONSE } from "../../lib/openapi"
import { getAuthUser, requireAuth } from "../../middleware/auth"

export const usersRoutes = new Hono<ApiEnv>().get(
	"/me",
	describeRoute({
		description:
			"Return the authenticated account. Session/OAuth is not wired yet.",
		responses: {
			200: jsonContent(UserPublicSchema, "Current user"),
			401: UNAUTHORIZED_RESPONSE
		},
		security: [{ SessionCookie: [] }],
		summary: "Current user",
		tags: ["Users"]
	}),
	requireAuth,
	(c) => c.json(getAuthUser(c))
)
