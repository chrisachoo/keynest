import type { KdfParams, KdfRequest, KdfResponse } from "@keynest/shared"
import { runArgon2Kdf, setStretchMasterKeyRunner } from "@keynest/utils"

import VaultKdfWorker from "@/workers/vault-kdf.worker?worker"

type Pending = {
	reject: (error: Error) => void
	resolve: (hash: Uint8Array) => void
}

type WorkerPostScope = {
	postMessage(message: KdfRequest): void
}

export const VAULT_KDF_WORKER_FAILED = "Vault KDF worker failed"
export const VAULT_KDF_MESSAGE_FAILED = "Vault KDF worker message failed"

function postKdfRequest(worker: Worker, request: KdfRequest) {
	;(worker as WorkerPostScope).postMessage(request)
}

let worker: Worker | null = null
let nextId = 0
let createWorker = (): Worker => new VaultKdfWorker()

const pending = new Map<number, Pending>()

export function isVaultKdfInfrastructureError(error: unknown): boolean {
	return (
		error instanceof Error &&
		(error.message === VAULT_KDF_WORKER_FAILED ||
			error.message === VAULT_KDF_MESSAGE_FAILED)
	)
}

function rejectAllPending(error: Error) {
	for (const [id, entry] of pending) {
		pending.delete(id)
		entry.reject(error)
	}
}

export function disposeVaultKdfWorker() {
	if (!worker) return
	worker.terminate()
	worker = null
}

function attachWorkerListeners(activeWorker: Worker) {
	activeWorker.addEventListener(
		"message",
		(event: MessageEvent<KdfResponse>) => {
			const data = event.data
			const entry = pending.get(data.id)

			if (!entry) return

			pending.delete(data.id)

			if (data.ok) entry.resolve(data.hash)
			else entry.reject(new Error(data.error))
		}
	)

	activeWorker.addEventListener("error", () => {
		rejectAllPending(new Error(VAULT_KDF_WORKER_FAILED))
		disposeVaultKdfWorker()
	})

	activeWorker.addEventListener("messageerror", () => {
		rejectAllPending(new Error(VAULT_KDF_MESSAGE_FAILED))
		disposeVaultKdfWorker()
	})
}

function getWorker() {
	if (!worker) {
		worker = createWorker()
		attachWorkerListeners(worker)
	}

	return worker
}

function stretchMasterKeyViaWorkerOnce(
	password: string,
	params: KdfParams
): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		const id = nextId++
		pending.set(id, { reject, resolve })
		postKdfRequest(getWorker(), { id, params, password })
	})
}

async function tryStretchViaWorker(
	password: string,
	params: KdfParams
): Promise<Uint8Array | null> {
	try {
		return await stretchMasterKeyViaWorkerOnce(password, params)
	} catch (error) {
		if (!isVaultKdfInfrastructureError(error)) throw error
		disposeVaultKdfWorker()
		return null
	}
}

async function stretchMasterKeyInWorker(
	password: string,
	params: KdfParams
): Promise<Uint8Array> {
	const firstAttempt = await tryStretchViaWorker(password, params)
	if (firstAttempt) return firstAttempt

	const secondAttempt = await tryStretchViaWorker(password, params)
	if (secondAttempt) return secondAttempt

	return runArgon2Kdf(password, params)
}

export function installVaultKdfWorker() {
	setStretchMasterKeyRunner(stretchMasterKeyInWorker)
}

/** @internal Test helpers */
export function resetVaultKdfWorkerForTests(options?: {
	createWorker?: () => Worker
}) {
	disposeVaultKdfWorker()
	pending.clear()
	nextId = 0
	createWorker = options?.createWorker ?? (() => new VaultKdfWorker())
}

export function getVaultKdfWorkerForTests() {
	return worker
}
