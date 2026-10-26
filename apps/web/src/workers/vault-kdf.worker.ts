import type { KdfRequest } from "@keynest/shared"
import { runArgon2Kdf } from "@keynest/utils"

type KdfResponse =
	| { error: string; id: number; ok: false }
	| { hash: Uint8Array; id: number; ok: true }

type WorkerReplyScope = {
	postMessage(message: KdfResponse): void
}

function postKdfResponse(response: KdfResponse) {
	;(globalThis as WorkerReplyScope).postMessage(response)
}

globalThis.addEventListener(
	"message",
	async (event: MessageEvent<KdfRequest>) => {
		if (event.origin !== globalThis.location.origin) return

		const { id, params, password } = event.data

		try {
			const hash = await runArgon2Kdf(password, params)
			const response: KdfResponse = {
				hash: new Uint8Array(hash),
				id,
				ok: true
			}
			postKdfResponse(response)
		} catch (error) {
			const message = error instanceof Error ? error.message : "KDF failed"
			const response: KdfResponse = { error: message, id, ok: false }
			postKdfResponse(response)
		}
	}
)
