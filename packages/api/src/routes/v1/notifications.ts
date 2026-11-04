import { desc, eq, notification } from "@keynest/db"
import { NotificationListSchema } from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { jsonContent, UNAUTHORIZED_RESPONSE } from "../../lib/openapi"
import { limitAuthSession } from "../../lib/rate-limit"
import { getAuthUser, requireAuth } from "../../middleware/auth"

const NOTIFICATION_LIMIT = 50

export const notificationRoutes = new Hono<ApiEnv>()
	.use("*", requireAuth, limitAuthSession)
	.get(
		"/",
		describeRoute({
			description: "List the latest notifications for the current account.",
			responses: {
				200: jsonContent(NotificationListSchema, "Notifications"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "List notifications",
			tags: ["Notifications"]
		}),
		async (c) => {
			const user = getAuthUser(c)
			const rows = await c
				.get("db")
				.select()
				.from(notification)
				.where(eq(notification.userId, user.id))
				.orderBy(desc(notification.createdAt), desc(notification.id))
				.limit(NOTIFICATION_LIMIT)

			return c.json({
				notifications: rows.map((row) => ({
					body: row.body,
					createdAt: row.createdAt.toISOString(),
					id: row.id,
					kind: row.kind,
					title: row.title
				}))
			})
		}
	)
