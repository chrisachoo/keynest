import type { KdfParams, KdfRequest, KdfResponse } from "@keynest/shared"
import {
	clearStretchMasterKeyRunner,
	runArgon2Kdf,
	stretchMasterKey
} from "@keynest/utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
	disposeVaultKdfWorker,
	getVaultKdfWorkerForTests,
	installVaultKdfWorker,
	resetVaultKdfWorkerForTests
} from "@/lib/kdf-worker"

function mockVaultKdfWorkerConstructor() {
	return {
		addEventListener: vi.fn(),
		postMessage: vi.fn(),
		terminate: vi.fn()
	} as unknown as Worker
}

vi.mock("@/workers/vault-kdf.worker?worker", () => ({
	default: mockVaultKdfWorkerConstructor
}))

vi.mock("@keynest/utils", async (importOriginal) => {
	const original = await importOriginal<typeof import("@keynest/utils")>()
	return {
		...original,
		runArgon2Kdf: vi.fn(original.runArgon2Kdf)
	}
})

const params: KdfParams = {
	kdfIterations: 1,
	kdfMemory: 8192,
	kdfParallelism: 1,
	vaultSalt: "0123456789012345678901"
}

type MockWorkerMode =
	| { kind: "error" }
	| { kind: "hash"; hash: Uint8Array }
	| { kind: "kdf-error"; message: string }
	| { kind: "silent" }

type MockWorkerHandle = Worker & {
	dispatchMessageError(): void
	terminate: ReturnType<typeof vi.fn>
}

function createMockWorker(mode: MockWorkerMode): MockWorkerHandle {
	const listeners = new Map<string, Set<EventListener>>()

	const worker = {
		addEventListener(type: string, listener: EventListener) {
			if (!listeners.has(type)) listeners.set(type, new Set())
			listeners.get(type)!.add(listener)
		},
		postMessage(message: KdfRequest) {
			queueMicrotask(() => {
				if (mode.kind === "silent") return

				if (mode.kind === "error") {
					for (const listener of listeners.get("error") ?? []) {
						listener(new Event("error"))
					}
					return
				}

				const messageListeners = listeners.get("message") ?? new Set()
				for (const listener of messageListeners) {
					const response: KdfResponse =
						mode.kind === "kdf-error"
							? { error: mode.message, id: message.id, ok: false }
							: {
									hash: new Uint8Array(mode.hash),
									id: message.id,
									ok: true
								}
					listener({ data: response } as MessageEvent<KdfResponse>)
				}
			})
		},
		terminate: vi.fn(),
		dispatchMessageError() {
			for (const listener of listeners.get("messageerror") ?? []) {
				listener(new Event("messageerror"))
			}
		}
	}

	return worker as unknown as MockWorkerHandle
}

describe("kdf-worker", () => {
	beforeEach(() => {
		vi.mocked(runArgon2Kdf).mockReset()
		vi.mocked(runArgon2Kdf).mockImplementation(async () => new Uint8Array(32))
		clearStretchMasterKeyRunner()
		resetVaultKdfWorkerForTests()
	})

	afterEach(() => {
		disposeVaultKdfWorker()
		clearStretchMasterKeyRunner()
	})

	it("returns the worker hash for a successful KDF", async () => {
		const hash = new Uint8Array([1, 2, 3])
		resetVaultKdfWorkerForTests({
			createWorker: () => createMockWorker({ hash, kind: "hash" })
		})
		installVaultKdfWorker()

		await expect(stretchMasterKey("password", params)).resolves.toEqual(hash)
		expect(runArgon2Kdf).not.toHaveBeenCalled()
	})

	it("rejects crypto failures without using the main-thread fallback", async () => {
		resetVaultKdfWorkerForTests({
			createWorker: () =>
				createMockWorker({ kind: "kdf-error", message: "Invalid vault salt" })
		})
		installVaultKdfWorker()

		await expect(stretchMasterKey("password", params)).rejects.toThrow(
			"Invalid vault salt"
		)
		expect(runArgon2Kdf).not.toHaveBeenCalled()
		expect(getVaultKdfWorkerForTests()).not.toBeNull()
	})

	it("recreates the worker after a worker error and completes the retry", async () => {
		const hash = new Uint8Array([9, 8, 7])
		let created = 0
		resetVaultKdfWorkerForTests({
			createWorker: () => {
				created += 1
				return createMockWorker(
					created === 1 ? { kind: "error" } : { hash, kind: "hash" }
				)
			}
		})
		installVaultKdfWorker()

		await expect(stretchMasterKey("password", params)).resolves.toEqual(hash)
		expect(created).toBe(2)
		expect(runArgon2Kdf).not.toHaveBeenCalled()
	})

	it("falls back to main-thread KDF when the worker keeps failing", async () => {
		const fallback = new Uint8Array(32).fill(4)
		vi.mocked(runArgon2Kdf).mockResolvedValue(fallback)
		resetVaultKdfWorkerForTests({
			createWorker: () => createMockWorker({ kind: "error" })
		})
		installVaultKdfWorker()

		await expect(stretchMasterKey("password", params)).resolves.toEqual(
			fallback
		)
		expect(runArgon2Kdf).toHaveBeenCalledWith("password", params)
	})

	it("disposes the worker and retries after messageerror", async () => {
		const hash = new Uint8Array([5, 6, 7])
		let created = 0
		let broken: MockWorkerHandle | null = null

		resetVaultKdfWorkerForTests({
			createWorker: () => {
				created += 1
				if (created === 1) {
					broken = createMockWorker({ kind: "silent" })
					return broken
				}
				return createMockWorker({ hash, kind: "hash" })
			}
		})
		installVaultKdfWorker()

		const pending = stretchMasterKey("password", params)
		await Promise.resolve()
		broken!.dispatchMessageError()

		await expect(pending).resolves.toEqual(hash)
		expect(broken!.terminate).toHaveBeenCalled()
		expect(created).toBe(2)
	})

	it("terminates the worker after a global error before retrying", async () => {
		const hash = new Uint8Array([9, 8, 7])
		let created = 0
		let firstWorker: MockWorkerHandle | null = null

		resetVaultKdfWorkerForTests({
			createWorker: () => {
				created += 1
				if (created === 1) {
					firstWorker = createMockWorker({ kind: "error" })
					return firstWorker
				}
				return createMockWorker({ hash, kind: "hash" })
			}
		})
		installVaultKdfWorker()

		await expect(stretchMasterKey("password", params)).resolves.toEqual(hash)
		expect(firstWorker!.terminate).toHaveBeenCalled()
		expect(created).toBe(2)
	})
})
