import * as Alchemy from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as Output from "alchemy/Output"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"

import { webWorkerDomain } from "./src/domains"
import { securityHeaders } from "./src/security-headers"
import { validateStageDeploy } from "./src/stage-guards"
import { createEventsWorker, createServer } from "./src/workers"

export { db } from "./src/database"
export type { EventsWorkerEnv, ServerEnv } from "./src/workers"

export default Alchemy.Stack(
	"keynest",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state()
	},
	Effect.gen(function* () {
		const stage = yield* Alchemy.Stage
		yield* validateStageDeploy(stage)

		const events = yield* Cloudflare.Queues.Queue("events")
		const serverWorker = yield* createServer(stage, events)
		const eventsWorker = yield* createEventsWorker()
		yield* Cloudflare.Queues.Consumer("signup", {
			queueId: events.queueId,
			scriptName: eventsWorker.workerName
		})

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
			domain: webWorkerDomain(stage),
			env: {
				VITE_GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID").pipe(
					Config.withDefault("")
				),
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
