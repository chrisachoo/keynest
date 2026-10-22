import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as Output from "alchemy/Output"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"

const PRODUCTION_STAGE = "production"
const WEB_HOST = "keynest.me"
const API_HOST = "api.keynest.me"
const PRODUCTION_ORIGIN = `https://${WEB_HOST}`

// D1 Time Travel is an account setting Alchemy cannot enable. Turn it on for
// the production database in the Cloudflare dashboard before inviting users,
// and rehearse a restore on a non-production stage. This database is the only
// copy of vault ciphertext.

export const db = Cloudflare.D1.Database("database", {
	migrations: "../../packages/db/src/migrations"
})

function limitNamespace(stage: string, offset: number) {
	return (stage === PRODUCTION_STAGE ? 1000 : 2000) + offset
}

function createServer(stage: string, events: Cloudflare.Queues.Queue) {
	return Cloudflare.Worker("server", {
		dev: {
			port: 8080
		},
		domain:
			stage === PRODUCTION_STAGE
				? { name: API_HOST, zoneName: WEB_HOST }
				: undefined,
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
			COOKIE_SECRET: Config.String("COOKIE_SECRET"),
			CORS_ORIGIN: Config.String("CORS_ORIGIN"),
			DB: db,
			EMAIL_FROM: Config.String("EMAIL_FROM").pipe(Config.withDefault("")),
			EVENTS: events,
			RESEND_API_KEY: Config.String("RESEND_API_KEY").pipe(
				Config.withDefault("")
			)
		},
		main: "../../apps/server/src/index.ts"
	})
}

function createEventsWorker() {
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

function securityHeaders(apiOrigin: string) {
	const policy = [
		"default-src 'self'",
		"script-src 'self'",
		"style-src 'self'",
		"style-src-attr 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		`connect-src 'self' ${apiOrigin}`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'"
	].join("; ")

	return [
		"/*",
		`  Content-Security-Policy: ${policy}`,
		"  Cross-Origin-Opener-Policy: same-origin",
		"  Referrer-Policy: no-referrer",
		"  Strict-Transport-Security: max-age=15552000; includeSubDomains",
		"  X-Content-Type-Options: nosniff",
		"  X-Frame-Options: DENY",
		"  Permissions-Policy: camera=(), microphone=(), geolocation=()"
	].join("\n")
}

export default Alchemy.Stack(
	"keynest",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state()
	},
	Effect.gen(function* () {
		const stage = yield* Alchemy.Stage

		if (stage === PRODUCTION_STAGE) {
			const emailFrom = yield* Config.String("EMAIL_FROM").pipe(
				Config.withDefault("")
			)
			const resendKey = yield* Config.String("RESEND_API_KEY").pipe(
				Config.withDefault("")
			)
			const origin = yield* Config.String("CORS_ORIGIN")
			if (!emailFrom || !resendKey) {
				return yield* Effect.die(
					new Error(
						"Production requires EMAIL_FROM and RESEND_API_KEY so signup can confirm an address."
					)
				)
			}
			if (origin !== PRODUCTION_ORIGIN) {
				return yield* Effect.die(
					new Error(`Production CORS_ORIGIN must be ${PRODUCTION_ORIGIN}.`)
				)
			}
		}

		const events = yield* Cloudflare.Queues.Queue("events")
		const serverWorker = yield* createServer(stage, events)
		const eventsWorker = yield* createEventsWorker()
		yield* Cloudflare.Queues.Consumer("signup", {
			queueId: events.queueId,
			scriptName: eventsWorker.workerName
		})

		// `url.asEffect()` reads RuntimeContext, which exists only inside a
		// running Worker. Map the output so plan/`alchemy dev` can resolve it.
		const apiOrigin = Output.map(
			serverWorker.url,
			(apiUrl) =>
				new URL(apiUrl && apiUrl.length > 0 ? apiUrl : "http://localhost:8080")
					.origin
		)

		const webWorker = yield* Cloudflare.Website.Vite("web", {
			assets: {
				headers: Output.map(apiOrigin, securityHeaders),
				notFoundHandling: "single-page-application"
			},
			dev: { port: 5173 },
			domain:
				stage === PRODUCTION_STAGE
					? { name: WEB_HOST, zoneName: WEB_HOST }
					: undefined,
			env: {
				VITE_SERVER_URL: serverWorker.url.as<string>()
			},
			rootDir: "../../apps/web"
		})

		return {
			server: serverWorker.url,
			web: webWorker.url
		}
	})
)
