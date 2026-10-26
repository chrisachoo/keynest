import { and, eq, session } from "@keynest/db"
import {
	RevokeOthersInputSchema,
	SessionIdParamSchema,
	SessionListSchema
} from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { badRequest, notFound } from "../../lib/http"
import { jsonContent, UNAUTHORIZED_RESPONSE } from "../../lib/openapi"
import { verifierMatches } from "../../lib/password"
import { limitAuthSession } from "../../lib/rate-limit"
import { storedVerifier } from "../../lib/user"
import { getAuthUser, requireAuth } from "../../middleware/auth"
import { clearSessionCookie } from "../../services/cookie"
import { destroyUserSessions, listSessions } from "../../services/session"

export const sessionRoutes = new Hono<ApiEnv>()
	.use("*", requireAuth, limitAuthSession)
	.get(
		"/",
		describeRoute({
			description: "List sessions for the current account.",
			responses: {
				200: jsonContent(SessionListSchema, "Sessions"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		async (c) => {
			const current = getAuthUser(c)
			return c.json({
				sessions: await listSessions(
					c.get("db"),
					current.id,
					c.get("sessionId")
				)
			})
		}
	)
	.post(
		"/revoke-others",
		describeRoute({
			description: "Sign out every session except this one.",
			responses: {
				204: { description: "Other sessions signed out" },
				400: { description: "Incorrect password" },
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		validator("json", RevokeOthersInputSchema),
		async (c) => {
			const current = getAuthUser(c)
			const db = c.get("db")
			const hash = await storedVerifier(db, current.id)
			if (!verifierMatches(c.req.valid("json").verifier, hash))
				throw badRequest("Incorrect password")

			const sessionId = c.get("sessionId")
			if (sessionId) await destroyUserSessions(db, current.id, sessionId)
			return c.body(null, 204)
		}
	)
	.delete(
		"/:id",
		describeRoute({
			description: "Sign out one session.",
			responses: {
				204: { description: "Session signed out" },
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			tags: ["Auth"]
		}),
		validator("param", SessionIdParamSchema),
		async (c) => {
			const current = getAuthUser(c)
			const { id } = c.req.valid("param")
			const db = c.get("db")
			const [deleted] = await db
				.delete(session)
				.where(and(eq(session.id, id), eq(session.userId, current.id)))
				.returning({ id: session.id })
			if (!deleted) throw notFound("Session not found")
			if (id === c.get("sessionId")) clearSessionCookie(c)
			return c.body(null, 204)
		}
	)
