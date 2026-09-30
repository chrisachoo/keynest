import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
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
		CORS_ORIGIN: Config.String("CORS_ORIGIN"),
		DB: db
	},
	main: "../../apps/server/src/index.ts"
})

export type ServerEnv = Cloudflare.InferEnv<typeof server>

export default Alchemy.Stack(
	"keynest",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state()
	},
	Effect.gen(function* () {
		const serverWorker = yield* server

		const webWorker = yield* Cloudflare.Website.Vite("web", {
			assets: {
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
