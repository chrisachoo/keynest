import type { Database } from "@keynest/db"
import type { UserPublicSchema } from "@keynest/shared"

export type ApiEnv = {
	Bindings: {
		COOKIE_SECRET: string
		CORS_ORIGIN: string
		DB: D1Database
	}
	Variables: {
		db: Database
		sessionId: string | null
		user: UserPublicSchema | null
	}
}
