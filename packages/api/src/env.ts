import type { Database } from "@keynest/db"
import type { UserPublicSchema } from "@keynest/shared"

export type ApiEnv = {
	Bindings: {
		CORS_ORIGIN: string
		DB: D1Database
	}
	Variables: {
		db: Database
		user: null | UserPublicSchema
	}
}
