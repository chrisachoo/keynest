import type { KdfParams, KdfRequest, KdfResponse } from "@keynest/shared"
import { setStretchMasterKeyRunner } from "@keynest/utils"

import VaultKdfWorker from "@/workers/vault-kdf.worker?worker"

type Pending = {
	reject: (error: Error) => void
	resolve: (hash: Uint8Array) => void
}

type WorkerPostScope = {
	postMessage(message: KdfRequest): void
}

function postKdfRequest(worker: Worker, request: KdfRequest) {
	;(worker as WorkerPostScope).postMessage(request)
}

let worker: Worker | null = null
let nextId = 0

const pending = new Map<number, Pending>()

function getWorker() {
	if (!worker) {
		worker = new VaultKdfWorker()

		worker.addEventListener("message", (event: MessageEvent<KdfResponse>) => {
			const data = event.data
			const entry = pending.get(data.id)

			if (!entry) return

			pending.delete(data.id)

			if (data.ok) entry.resolve(data.hash)
			else entry.reject(new Error(data.error))
		})

		worker.addEventListener("error", () => {
			for (const [id, entry] of pending) {
				pending.delete(id)
				entry.reject(new Error("Vault KDF worker failed"))
			}
		})
	}

	return worker
}

function stretchMasterKeyInWorker(
	password: string,
	params: KdfParams
): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		const id = nextId++
		pending.set(id, { reject, resolve })
		postKdfRequest(getWorker(), { id, params, password })
	})
}

export function installVaultKdfWorker() {
	setStretchMasterKeyRunner(stretchMasterKeyInWorker)
}
