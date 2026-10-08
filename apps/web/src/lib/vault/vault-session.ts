import { deriveVaultKey } from "@/lib/vault/vault-crypto"

const LEGACY_STORAGE_KEY = "keynest.vault.session"

let generation = 0
let memoryKey: CryptoKey | null = null

try {
	sessionStorage.removeItem(LEGACY_STORAGE_KEY)
} catch {
	// Private browsing can block storage. The key still stays in memory only.
}

export const getVaultKey = () => memoryKey
export const getVaultGeneration = () => generation

export function lockVault() {
	generation += 1
	memoryKey = null
}

export async function installVaultKey(password: string, vaultSalt: string) {
	const stamp = generation
	const key = await deriveVaultKey(password, vaultSalt)
	if (stamp !== generation) return null
	memoryKey = key
	return memoryKey
}
