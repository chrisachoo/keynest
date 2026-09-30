import type { ServerEnv } from "@keynest/infra/alchemy.run"

export type CloudflareEnv = ServerEnv

declare global {
	type Env = CloudflareEnv
}

declare module "cloudflare:workers" {
	namespace Cloudflare {
		export type Env = CloudflareEnv
	}
}
