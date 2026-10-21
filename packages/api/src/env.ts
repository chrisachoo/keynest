import type { Database } from "@keynest/db"
import type { AuthSession, SignupEvent } from "@keynest/shared"

export type ApiEnv = {
	Bindings: {
		AUTH_ACCOUNT: RateLimit
		AUTH_IP: RateLimit
		AUTH_SESSION: RateLimit
		COOKIE_SECRET: string
		CORS_ORIGIN: string
		DB: D1Database
		EMAIL_FROM?: string
		EVENTS: Queue<SignupEvent>
		RESEND_API_KEY?: string
	}
	Variables: {
		db: Database
		sessionId: string | null
		user: AuthSession | null
	}
}
