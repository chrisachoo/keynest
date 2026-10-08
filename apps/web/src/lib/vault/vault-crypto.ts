import type { VaultItem, VaultItemType } from "@keynest/shared"
import * as v from "valibot"

const PAYLOAD_VERSION = 1
const VAULT_KEY_ITERATIONS = 600_000
const SALT_BYTES = 16

const nameField = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120))
const secretField = v.pipe(v.string(), v.minLength(1), v.maxLength(8_000))

const vaultPayload = v.variant("type", [
	v.object({
		name: nameField,
		schemaVersion: v.literal(PAYLOAD_VERSION),
		secret: secretField,
		type: v.literal("login"),
		username: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(320))
	}),
	v.object({
		name: nameField,
		schemaVersion: v.literal(PAYLOAD_VERSION),
		secret: secretField,
		type: v.literal("secure_note"),
		username: v.literal("")
	})
])

export type StoredVaultItem = Omit<VaultItem, "userId">
export type VaultPayload = v.InferOutput<typeof vaultPayload>

export type VaultDraft = {
	name: string
	secret: string
	type: VaultItemType
	username: string
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBase64(bytes: Uint8Array) {
	let binary = ""
	for (const byte of bytes) binary += String.fromCodePoint(byte)
	return btoa(binary)
}

function base64ToBytes(value: string) {
	const binary = atob(value)
	const bytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.codePointAt(index) ?? 0
	}
	return bytes
}

function decodeBase64Url(value: string) {
	const padded = value.replaceAll("-", "+").replaceAll("_", "/")
	const padLength = (4 - (padded.length % 4)) % 4
	return base64ToBytes(padded + "=".repeat(padLength))
}

function associatedData(id: string, type: VaultItemType) {
	return textEncoder.encode(`keynest.vault.v${PAYLOAD_VERSION}:${id}:${type}`)
}

export function draftPayload(draft: VaultDraft) {
	return v.parse(vaultPayload, {
		name: draft.name,
		schemaVersion: PAYLOAD_VERSION,
		secret: draft.secret,
		type: draft.type,
		username: draft.type === "login" ? draft.username : ""
	})
}

export async function deriveVaultKey(password: string, vaultSalt: string) {
	const salt = decodeBase64Url(vaultSalt)
	if (salt.byteLength !== SALT_BYTES) throw new Error("Invalid vault salt")

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		textEncoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	)

	return crypto.subtle.deriveKey(
		{
			hash: "SHA-256",
			iterations: VAULT_KEY_ITERATIONS,
			name: "PBKDF2",
			salt
		},
		keyMaterial,
		{ length: 256, name: "AES-GCM" },
		false,
		["decrypt", "encrypt"]
	)
}

export async function sealPayload(
	key: CryptoKey,
	id: string,
	payload: VaultPayload
) {
	const nonceBytes = crypto.getRandomValues(new Uint8Array(12))
	const ciphertext = await crypto.subtle.encrypt(
		{
			additionalData: associatedData(id, payload.type),
			iv: nonceBytes,
			name: "AES-GCM",
			tagLength: 128
		},
		key,
		textEncoder.encode(JSON.stringify(payload))
	)

	return {
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
		nonce: bytesToBase64(nonceBytes)
	}
}

export async function openPayload(key: CryptoKey, record: StoredVaultItem) {
	const nonce = base64ToBytes(record.nonce)
	if (nonce.byteLength !== 12) throw new Error("Invalid nonce")

	const plaintext = await crypto.subtle.decrypt(
		{
			additionalData: associatedData(record.id, record.type),
			iv: nonce,
			name: "AES-GCM",
			tagLength: 128
		},
		key,
		base64ToBytes(record.ciphertext)
	)
	const payload = v.parse(
		vaultPayload,
		JSON.parse(textDecoder.decode(plaintext))
	)
	if (payload.type !== record.type) throw new Error("Type mismatch")
	return payload
}
