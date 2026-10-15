import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as Output from "alchemy/Output"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"

export const db = Cloudflare.D1.Database("database", {
	migrations: "../../packages/db/src/migrations"
})

export const server = Cloudflare.Worker("server", {
	compatibility: {
		flags: ["nodejs_compat"]
	},
	dev: {
		port: 8080
	},
	env: {
		COOKIE_SECRET: Config.String("COOKIE_SECRET"),
		CORS_ORIGIN: Config.String("CORS_ORIGIN"),
		DB: db,
		EMAIL_FROM: Config.String("EMAIL_FROM").pipe(Config.withDefault("")),
		RESEND_API_KEY: Config.String("RESEND_API_KEY").pipe(Config.withDefault(""))
	},
	main: "../../apps/server/src/index.ts"
})

export type ServerEnv = Cloudflare.InferEnv<typeof server>

function securityHeaders(apiOrigin: string) {
	const policy = [
		"default-src 'self'",
		"script-src 'self'",
		"style-src 'self' 'unsafe-inline'",
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
		"  Referrer-Policy: no-referrer",
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
		const serverWorker = yield* server
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
			compatibility: { flags: ["nodejs_compat"] },
			dev: { port: 5173 },
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
