import { handleSignupEvent, InvalidSignupEvent } from "@keynest/services/signup"

import type { CloudflareEnv } from "../cloudflare-env.d.ts"

export default {
	async queue(batch, env: CloudflareEnv) {
		await Promise.all(
			batch.messages.map(async (message) => {
				try {
					await handleSignupEvent(env, message.body, message.id)
					message.ack()
				} catch (error) {
					if (error instanceof InvalidSignupEvent) message.ack()
					else message.retry()
				}
			})
		)
	}
} satisfies ExportedHandler<CloudflareEnv>
