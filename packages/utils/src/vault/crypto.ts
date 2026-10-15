import {
	PAYLOAD_VERSION,
	VaultPayloadSchema,
	type StoredVaultItem,
	type VaultDraft,
	type VaultItemType,
	type VaultPayload
} from "@keynest/shared"
import * as v from "valibot"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function bytesToBase64(bytes: Uint8Array) {
	let binary = ""
	for (const byte of bytes) binary += String.fromCodePoint(byte)
	return btoa(binary)
}

export function base64ToBytes(value: string) {
	const binary = atob(value)
	const bytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.codePointAt(index) ?? 0
	}
	return bytes
}

export function bytesToBase64Url(bytes: Uint8Array) {
	return bytesToBase64(bytes)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "")
}

export function base64UrlToBytes(value: string) {
	const padded = value.replaceAll("-", "+").replaceAll("_", "/")
	const padLength = (4 - (padded.length % 4)) % 4
	return base64ToBytes(padded + "=".repeat(padLength))
}

export function randomBytes(size: number) {
	return crypto.getRandomValues(new Uint8Array(size))
}

export function byteSource(bytes: Uint8Array): BufferSource {
	return Uint8Array.from(bytes)
}

export async function sealBytes(
	key: CryptoKey,
	plaintext: Uint8Array,
	aad: Uint8Array
) {
	const nonceBytes = randomBytes(12)
	const ciphertext = await crypto.subtle.encrypt(
		{
			additionalData: byteSource(aad),
			iv: byteSource(nonceBytes),
			name: "AES-GCM",
			tagLength: 128
		},
		key,
		byteSource(plaintext)
	)

	return {
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
		nonce: bytesToBase64(nonceBytes)
	}
}

export async function openBytes(
	key: CryptoKey,
	ciphertext: string,
	nonce: string,
	aad: Uint8Array
) {
	const nonceBytes = base64ToBytes(nonce)
	if (nonceBytes.byteLength !== 12) throw new Error("Invalid nonce")

	const plaintext = await crypto.subtle.decrypt(
		{
			additionalData: byteSource(aad),
			iv: byteSource(nonceBytes),
			name: "AES-GCM",
			tagLength: 128
		},
		key,
		byteSource(base64ToBytes(ciphertext))
	)

	return new Uint8Array(plaintext)
}

function associatedData(id: string, type: VaultItemType) {
	return textEncoder.encode(`keynest.vault.v${PAYLOAD_VERSION}:${id}:${type}`)
}

export function draftPayload(draft: VaultDraft) {
	return v.parse(VaultPayloadSchema, {
		name: draft.name,
		schemaVersion: PAYLOAD_VERSION,
		secret: draft.secret,
		type: draft.type,
		username: draft.type === "login" ? draft.username : ""
	})
}

export async function sealPayload(
	key: CryptoKey,
	id: string,
	payload: VaultPayload
) {
	return sealBytes(
		key,
		textEncoder.encode(JSON.stringify(payload)),
		associatedData(id, payload.type)
	)
}

export async function openPayload(
	key: CryptoKey,
	record: Pick<StoredVaultItem, "ciphertext" | "id" | "nonce" | "type">
) {
	const plaintext = await openBytes(
		key,
		record.ciphertext,
		record.nonce,
		associatedData(record.id, record.type)
	)
	const payload = v.parse(
		VaultPayloadSchema,
		JSON.parse(textDecoder.decode(plaintext))
	)
	if (payload.type !== record.type) throw new Error("Type mismatch")
	return payload
}
