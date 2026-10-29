import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { loadSession } from "../../middleware/auth"
import { requireSameOrigin } from "../../middleware/origin"
import { authRoutes } from "./auth"
import { errorRoutes } from "./errors"
import { oauthRoutes } from "./oauth"
import { sessionRoutes } from "./sessions"
import { totpRoutes } from "./totp"
import { usersRoutes } from "./users"
import { vaultItemRoutes } from "./vault-items"

export const v1 = new Hono<ApiEnv>()
	.use("*", loadSession)
	.use("*", requireSameOrigin)
	.route("/auth", authRoutes)
	.route("/auth", totpRoutes)
	.route("/auth/oauth", oauthRoutes)
	.route("/errors", errorRoutes)
	.route("/sessions", sessionRoutes)
	.route("/users", usersRoutes)
	.route("/vault-items", vaultItemRoutes)
