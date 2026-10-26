import type { KdfRequest } from "@keynest/shared"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@keynest/utils", () => ({
	runArgon2Kdf: vi.fn(async () => new Uint8Array([1, 2, 3]))
}))

type Handler = (event: MessageEvent<KdfRequest>) => Promise<void>

const request: KdfRequest = {
	id: 7,
	params: {
		kdfIterations: 1,
		kdfMemory: 8192,
		kdfParallelism: 1,
		vaultSalt: "0123456789012345678901"
	},
	password: "correct horse battery staple"
}

describe("vault-kdf worker", () => {
	let handler: Handler
	let postMessage: ReturnType<typeof vi.fn>

	beforeEach(async () => {
		vi.resetModules()
		postMessage = vi.fn()
		vi.stubGlobal("postMessage", postMessage)
		vi.stubGlobal("location", { origin: "https://keynest.me" })
		const addEventListener = vi.fn((_type: string, listener: Handler) => {
			handler = listener
		})
		vi.stubGlobal("addEventListener", addEventListener)
		await import("./vault-kdf.worker")
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	function send(origin: string) {
		return handler({ data: request, origin } as MessageEvent<KdfRequest>)
	}

	it("replies to page messages, which have an empty origin", async () => {
		await send("")
		expect(postMessage).toHaveBeenCalledWith({
			hash: new Uint8Array([1, 2, 3]),
			id: 7,
			ok: true
		})
	})

	it("replies to same-origin messages", async () => {
		await send("https://keynest.me")
		expect(postMessage).toHaveBeenCalledTimes(1)
	})

	it("ignores messages from a foreign origin", async () => {
		await send("https://evil.example")
		expect(postMessage).not.toHaveBeenCalled()
	})
})
