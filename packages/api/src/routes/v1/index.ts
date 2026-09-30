import { Hono } from "hono"

import type { ApiEnv } from "../../env"
import { usersRoutes } from "./users"
import { vaultItemRoutes } from "./vault-items"

export const v1 = new Hono<ApiEnv>()
	.route("/users", usersRoutes)
	.route("/vault-items", vaultItemRoutes)
