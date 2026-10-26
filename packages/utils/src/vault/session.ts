import type { StoredVaultItem, VaultWrap } from "@keynest/shared"

import { openPayload } from "./crypto"
import { stretchMasterKey } from "./kdf"
import { dataKeyFrom, wipe } from "./keys"

let generation = 0
let memoryKey: CryptoKey | null = null

export const getVaultKey = () => memoryKey
export const getVaultGeneration = () => generation

export function lockVault() {
	generation += 1
	memoryKey = null
}

export async function installMasterKey(
	masterKey: Uint8Array,
	material: VaultWrap
) {
	const stamp = generation
	try {
		const key = await dataKeyFrom(masterKey, material)
		if (stamp !== generation) return null
		memoryKey = key
		return memoryKey
	} finally {
		wipe(masterKey)
	}
}

export async function installVaultKey(password: string, material: VaultWrap) {
	const masterKey = await stretchMasterKey(password, material)
	return installMasterKey(masterKey, material)
}

export async function readItemSecret(
	item: Pick<StoredVaultItem, "ciphertext" | "id" | "nonce" | "type">
) {
	const key = getVaultKey()
	if (!key) throw new Error("Unlock the vault before revealing a secret.")
	const payload = await openPayload(key, item)
	return payload.secret
}
