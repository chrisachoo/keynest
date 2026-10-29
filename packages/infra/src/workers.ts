import * as Cloudflare from "alchemy/Cloudflare"
import * as Config from "effect/Config"

import { db } from "./database"
import { apiWorkerDomain, limitNamespace } from "./domains"

export function createServer(stage: string, events: Cloudflare.Queues.Queue) {
	return Cloudflare.Worker("server", {
		dev: {
			port: 8080
		},
		domain: apiWorkerDomain(stage),
		env: {
			AUTH_ACCOUNT: Cloudflare.RateLimit("AUTH_ACCOUNT", {
				namespaceId: limitNamespace(stage, 2),
				simple: { limit: 5, period: 60 }
			}),
			AUTH_IP: Cloudflare.RateLimit("AUTH_IP", {
				namespaceId: limitNamespace(stage, 1),
				simple: { limit: 20, period: 60 }
			}),
			AUTH_SESSION: Cloudflare.RateLimit("AUTH_SESSION", {
				namespaceId: limitNamespace(stage, 3),
				simple: { limit: 10, period: 60 }
			}),
			ERROR_REPORT: Cloudflare.RateLimit("ERROR_REPORT", {
				namespaceId: limitNamespace(stage, 4),
				simple: { limit: 5, period: 60 }
			}),
			COOKIE_SECRET: Config.String("COOKIE_SECRET"),
			TOTP_ENCRYPTION_KEY: Config.String("TOTP_ENCRYPTION_KEY"),
			CORS_ORIGIN: Config.String("CORS_ORIGIN"),
			DB: db,
			EMAIL_FROM: Config.String("EMAIL_FROM").pipe(Config.withDefault("")),
			EVENTS: events,
			GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID").pipe(
				Config.withDefault("")
			),
			GOOGLE_CLIENT_SECRET: Config.String("GOOGLE_CLIENT_SECRET").pipe(
				Config.withDefault("")
			),
			RESEND_API_KEY: Config.String("RESEND_API_KEY").pipe(
				Config.withDefault("")
			)
		},
		main: "../../apps/server/src/index.ts"
	})
}

export function createEventsWorker() {
	return Cloudflare.Worker("worker", {
		env: {
			CORS_ORIGIN: Config.String("CORS_ORIGIN"),
			DB: db,
			EMAIL_FROM: Config.String("EMAIL_FROM").pipe(Config.withDefault("")),
			RESEND_API_KEY: Config.String("RESEND_API_KEY").pipe(
				Config.withDefault("")
			)
		},
		main: "../../apps/worker/src/index.ts",
		workersDev: false
	})
}

export type EventsWorkerEnv = Cloudflare.InferEnv<
	ReturnType<typeof createEventsWorker>
>

export type ServerEnv = Cloudflare.InferEnv<ReturnType<typeof createServer>>
