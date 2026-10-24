import type { EventsWorkerEnv } from "@keynest/infra/alchemy.run"

export type CloudflareEnv = EventsWorkerEnv

declare global {
	type Env = CloudflareEnv
}
