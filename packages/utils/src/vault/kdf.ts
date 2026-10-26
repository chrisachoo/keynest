import { KDF_HASH_BYTES, SALT_BYTES, type KdfParams } from "@keynest/shared"
import { argon2id } from "hash-wasm"

import { base64UrlToBytes } from "./crypto"

export type StretchMasterKeyFn = (
	password: string,
	params: KdfParams
) => Promise<Uint8Array>

let stretchMasterKeyRunner: StretchMasterKeyFn | null = null

export function setStretchMasterKeyRunner(runner: StretchMasterKeyFn) {
	stretchMasterKeyRunner = runner
}

export function clearStretchMasterKeyRunner() {
	stretchMasterKeyRunner = null
}

export async function runArgon2Kdf(
	password: string,
	params: KdfParams
): Promise<Uint8Array> {
	const salt = base64UrlToBytes(params.vaultSalt)
	if (salt.byteLength !== SALT_BYTES) throw new Error("Invalid vault salt")

	const hash = await argon2id({
		hashLength: KDF_HASH_BYTES,
		iterations: params.kdfIterations,
		memorySize: params.kdfMemory,
		outputType: "binary",
		parallelism: params.kdfParallelism,
		password,
		salt
	})

	return new Uint8Array(hash)
}

export async function stretchMasterKey(password: string, params: KdfParams) {
	if (stretchMasterKeyRunner) {
		return stretchMasterKeyRunner(password, params)
	}
	return runArgon2Kdf(password, params)
}
