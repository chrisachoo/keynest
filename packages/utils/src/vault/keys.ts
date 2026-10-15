import {
	KDF_HASH_BYTES,
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM,
	RECOVERY_WORD_COUNT,
	SALT_BYTES,
	VAULT_EXPORT_VERSION,
	VaultExportSchema,
	type ChangePasswordInput,
	type KdfParams,
	type PreloginResult,
	type RecoverInput,
	type SignupInput,
	type StoredVaultItem,
	type VaultExport,
	type VaultWrap
} from "@keynest/shared"
import { argon2id } from "hash-wasm"
import * as v from "valibot"

import { WORD_LIST } from "../password"
import {
	base64UrlToBytes,
	byteSource,
	bytesToBase64Url,
	openBytes,
	randomBytes,
	sealBytes
} from "./crypto"

const KEY_CHECK = "keynest.keycheck.v1"
const HKDF_SALT = "keynest.hkdf.v1"
const AUTH_INFO = "keynest.auth.v1"
const WRAP_INFO = "keynest.wrap.v1"
const RECOVERY_AUTH_INFO = "keynest.recovery-auth.v1"
const RECOVERY_WRAP_INFO = "keynest.recovery-wrap.v1"
const DATA_KEY_INFO = "keynest.data-key.v1"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

type AccountSecrets = Omit<SignupInput, "email" | "name">

export function wipe(bytes: Uint8Array) {
	bytes.fill(0)
}

export async function stretchMasterKey(password: string, params: KdfParams) {
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

export async function createAccountSecrets(password: string): Promise<{
	masterKey: Uint8Array
	recoveryPhrase: string
	secrets: AccountSecrets
}> {
	const vaultSalt = bytesToBase64Url(randomBytes(SALT_BYTES))
	const recoverySalt = bytesToBase64Url(randomBytes(SALT_BYTES))
	const recoveryPhrase = generateRecoveryPhrase()
	const masterKey = await stretchMasterKey(password, defaultKdf(vaultSalt))

	try {
		const recoveryKey = await stretchMasterKey(
			normalizePhrase(recoveryPhrase),
			defaultKdf(recoverySalt)
		)
		try {
			const dataKey = randomBytes(KDF_HASH_BYTES)
			try {
				const wrapped = await wrapDataKey(masterKey, dataKey, WRAP_INFO)
				const recoveryWrapped = await wrapDataKey(
					recoveryKey,
					dataKey,
					RECOVERY_WRAP_INFO
				)
				const check = await sealKeyCheck(masterKey)

				return {
					masterKey,
					recoveryPhrase,
					secrets: {
						...check,
						...wrapped,
						recoverySalt,
						recoveryVerifier: await deriveVerifier(
							recoveryKey,
							RECOVERY_AUTH_INFO
						),
						recoveryWrappedKey: recoveryWrapped.wrappedKey,
						recoveryWrappedKeyNonce: recoveryWrapped.wrappedKeyNonce,
						vaultSalt,
						verifier: await deriveVerifier(masterKey, AUTH_INFO)
					}
				}
			} finally {
				wipe(dataKey)
			}
		} finally {
			wipe(recoveryKey)
		}
	} catch (error) {
		wipe(masterKey)
		throw error
	}
}

export async function loginSecrets(password: string, prelogin: PreloginResult) {
	const masterKey = await stretchMasterKey(password, prelogin)
	try {
		return {
			masterKey,
			verifier: await deriveVerifier(masterKey, AUTH_INFO)
		}
	} catch (error) {
		wipe(masterKey)
		throw error
	}
}

export async function dataKeyFrom(masterKey: Uint8Array, material: VaultWrap) {
	await verifyKeyCheck(masterKey, material)
	const bytes = await unwrapDataKey(masterKey, material, WRAP_INFO)
	try {
		return importDataKey(bytes)
	} finally {
		wipe(bytes)
	}
}

export async function changePasswordSecrets(
	currentPassword: string,
	newPassword: string,
	material: VaultWrap
): Promise<ChangePasswordInput> {
	const currentKey = await stretchMasterKey(currentPassword, material)
	try {
		await verifyKeyCheck(currentKey, material)
		const dataKey = await unwrapDataKey(currentKey, material, WRAP_INFO)
		try {
			const vaultSalt = bytesToBase64Url(randomBytes(SALT_BYTES))
			const nextKey = await stretchMasterKey(newPassword, {
				...material,
				vaultSalt
			})
			try {
				const wrapped = await wrapDataKey(nextKey, dataKey, WRAP_INFO)
				const check = await sealKeyCheck(nextKey)
				return {
					...check,
					...wrapped,
					newVerifier: await deriveVerifier(nextKey, AUTH_INFO),
					vaultSalt,
					verifier: await deriveVerifier(currentKey, AUTH_INFO)
				}
			} finally {
				wipe(nextKey)
			}
		} finally {
			wipe(dataKey)
		}
	} finally {
		wipe(currentKey)
	}
}

export async function accountVerifier(password: string, material: KdfParams) {
	const masterKey = await stretchMasterKey(password, material)
	try {
		return await deriveVerifier(masterKey, AUTH_INFO)
	} finally {
		wipe(masterKey)
	}
}

export async function recoverSecrets(
	recoveryPhrase: string,
	newPassword: string,
	prelogin: PreloginResult
): Promise<{ masterKey: Uint8Array; request: Omit<RecoverInput, "email"> }> {
	const recoveryKey = await stretchMasterKey(
		normalizePhrase(recoveryPhrase),
		defaultKdf(prelogin.recoverySalt, prelogin)
	)

	try {
		const dataKey = await openBytes(
			await wrappingKey(recoveryKey, RECOVERY_WRAP_INFO),
			prelogin.recoveryWrappedKey,
			prelogin.recoveryWrappedKeyNonce,
			textEncoder.encode(DATA_KEY_INFO)
		).catch((error: unknown) => {
			throw new Error("Recovery code is incorrect.", { cause: error })
		})

		try {
			const vaultSalt = bytesToBase64Url(randomBytes(SALT_BYTES))
			const masterKey = await stretchMasterKey(newPassword, {
				...prelogin,
				vaultSalt
			})
			try {
				const wrapped = await wrapDataKey(masterKey, dataKey, WRAP_INFO)
				const check = await sealKeyCheck(masterKey)
				return {
					masterKey,
					request: {
						...check,
						...wrapped,
						recoveryVerifier: await deriveVerifier(
							recoveryKey,
							RECOVERY_AUTH_INFO
						),
						vaultSalt,
						verifier: await deriveVerifier(masterKey, AUTH_INFO)
					}
				}
			} catch (error) {
				wipe(masterKey)
				throw error
			}
		} finally {
			wipe(dataKey)
		}
	} finally {
		wipe(recoveryKey)
	}
}

export function buildVaultExport(
	material: VaultWrap,
	items: StoredVaultItem[]
): VaultExport {
	return v.parse(VaultExportSchema, {
		items,
		kdfIterations: material.kdfIterations,
		kdfMemory: material.kdfMemory,
		kdfParallelism: material.kdfParallelism,
		keyCheck: material.keyCheck,
		keyCheckNonce: material.keyCheckNonce,
		vaultSalt: material.vaultSalt,
		version: VAULT_EXPORT_VERSION,
		wrappedKey: material.wrappedKey,
		wrappedKeyNonce: material.wrappedKeyNonce
	})
}

export function downloadVaultExport(file: VaultExport) {
	const url = URL.createObjectURL(
		new Blob([JSON.stringify(file)], { type: "application/json" })
	)
	const link = document.createElement("a")
	link.href = url
	link.download = "keynest-vault.json"
	link.click()
	URL.revokeObjectURL(url)
}

function defaultKdf(
	vaultSalt: string,
	params: Pick<KdfParams, "kdfIterations" | "kdfMemory" | "kdfParallelism"> = {
		kdfIterations: KDF_ITERATIONS,
		kdfMemory: KDF_MEMORY_KIB,
		kdfParallelism: KDF_PARALLELISM
	}
): KdfParams {
	return { ...params, vaultSalt }
}

function generateRecoveryPhrase() {
	return Array.from({ length: RECOVERY_WORD_COUNT }, randomWord).join(" ")
}

function randomWord() {
	const limit = 2 ** 32 - (2 ** 32 % WORD_LIST.length)
	const buffer = new Uint32Array(1)
	let value = 2 ** 32

	while (value >= limit) {
		crypto.getRandomValues(buffer)
		value = buffer[0] ?? 2 ** 32
	}

	const word = WORD_LIST[value % WORD_LIST.length]
	if (!word) throw new Error("Word list is empty")
	return word
}

function normalizePhrase(phrase: string) {
	return phrase.trim().toLowerCase().split(/\s+/).join(" ")
}

async function deriveVerifier(masterKey: Uint8Array, info: string) {
	const material = await crypto.subtle.importKey(
		"raw",
		byteSource(masterKey),
		"HKDF",
		false,
		["deriveBits"]
	)
	const bits = await crypto.subtle.deriveBits(
		{
			hash: "SHA-256",
			info: textEncoder.encode(info),
			name: "HKDF",
			salt: textEncoder.encode(HKDF_SALT)
		},
		material,
		KDF_HASH_BYTES * 8
	)
	return bytesToBase64Url(new Uint8Array(bits))
}

async function wrappingKey(masterKey: Uint8Array, info: string) {
	const material = await crypto.subtle.importKey(
		"raw",
		byteSource(masterKey),
		"HKDF",
		false,
		["deriveKey"]
	)
	return crypto.subtle.deriveKey(
		{
			hash: "SHA-256",
			info: textEncoder.encode(info),
			name: "HKDF",
			salt: textEncoder.encode(HKDF_SALT)
		},
		material,
		{ length: 256, name: "AES-GCM" },
		false,
		["decrypt", "encrypt"]
	)
}

async function wrapDataKey(
	masterKey: Uint8Array,
	dataKey: Uint8Array,
	info: string
) {
	const sealed = await sealBytes(
		await wrappingKey(masterKey, info),
		dataKey,
		textEncoder.encode(DATA_KEY_INFO)
	)
	return {
		wrappedKey: sealed.ciphertext,
		wrappedKeyNonce: sealed.nonce
	}
}

async function unwrapDataKey(
	masterKey: Uint8Array,
	material: Pick<VaultWrap, "wrappedKey" | "wrappedKeyNonce">,
	info: string
) {
	try {
		return await openBytes(
			await wrappingKey(masterKey, info),
			material.wrappedKey,
			material.wrappedKeyNonce,
			textEncoder.encode(DATA_KEY_INFO)
		)
	} catch {
		throw new Error("Incorrect password.")
	}
}

async function sealKeyCheck(masterKey: Uint8Array) {
	const sealed = await sealBytes(
		await wrappingKey(masterKey, WRAP_INFO),
		textEncoder.encode(KEY_CHECK),
		textEncoder.encode(KEY_CHECK)
	)
	return {
		keyCheck: sealed.ciphertext,
		keyCheckNonce: sealed.nonce
	}
}

async function verifyKeyCheck(
	masterKey: Uint8Array,
	material: Pick<VaultWrap, "keyCheck" | "keyCheckNonce">
) {
	try {
		const opened = await openBytes(
			await wrappingKey(masterKey, WRAP_INFO),
			material.keyCheck,
			material.keyCheckNonce,
			textEncoder.encode(KEY_CHECK)
		)
		if (textDecoder.decode(opened) !== KEY_CHECK)
			throw new Error("Incorrect password.")
	} catch (error) {
		if (error instanceof Error && error.message === "Incorrect password.")
			throw error
		throw new Error("Incorrect password.", { cause: error })
	}
}

function importDataKey(bytes: Uint8Array) {
	return crypto.subtle.importKey("raw", byteSource(bytes), "AES-GCM", false, [
		"decrypt",
		"encrypt"
	])
}
