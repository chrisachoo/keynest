import { vaultItem, type VaultItem, type VaultItemType } from "@keynest/shared"
import * as v from "valibot"

const STORAGE_KEY = "keynest.vault.session"
const PAYLOAD_VERSION = 1

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

const storedVaultItem = v.omit(vaultItem, ["userId"])

const sessionEnvelope = v.object({
	items: v.array(storedVaultItem),
	keyId: v.pipe(v.string(), v.uuid())
})

export type StoredVaultItem = Omit<VaultItem, "userId">
export type VaultPayload = v.InferOutput<typeof vaultPayload>

export type VaultDraft = {
	name: string
	secret: string
	type: VaultItemType
	username: string
}

type MemoryKey = {
	id: string
	key: CryptoKey
}

type BootResult =
	| {
			key: CryptoKey
			keyId: string
			notice: string | null
			records: StoredVaultItem[]
			status: "unlocked"
	  }
	| {
			itemCount: number
			status: "locked"
	  }

let memoryKey: MemoryKey | null = null
let bootPromise: Promise<BootResult> | null = null

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

function associatedData(id: string, type: VaultItemType) {
	return textEncoder.encode(`keynest.vault.v${PAYLOAD_VERSION}:${id}:${type}`)
}

async function createMemoryKey() {
	const key = await crypto.subtle.generateKey(
		{ length: 256, name: "AES-GCM" },
		false,
		["decrypt", "encrypt"]
	)
	const created = { id: crypto.randomUUID(), key }
	memoryKey = created
	return created
}

function readEnvelope() {
	const raw = sessionStorage.getItem(STORAGE_KEY)
	if (!raw) return { status: "empty" } as const

	try {
		return {
			envelope: v.parse(sessionEnvelope, JSON.parse(raw)),
			status: "valid" as const
		}
	} catch {
		return { status: "invalid" } as const
	}
}

function writeEnvelope(keyId: string, items: StoredVaultItem[]) {
	const envelope = v.parse(sessionEnvelope, { items, keyId })
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
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

export async function sealPayload(
	key: CryptoKey,
	id: string,
	payload: VaultPayload,
	timestamps?: { createdAt: string }
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
	const now = new Date().toISOString()

	return v.parse(storedVaultItem, {
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
		createdAt: timestamps?.createdAt ?? now,
		id,
		nonce: bytesToBase64(nonceBytes),
		type: payload.type,
		updatedAt: now
	})
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

async function bootVaultOnce(): Promise<BootResult> {
	const stored = readEnvelope()

	if (stored.status === "empty") {
		const created = await createMemoryKey()
		writeEnvelope(created.id, [])
		return {
			key: created.key,
			keyId: created.id,
			notice: null,
			records: [],
			status: "unlocked"
		}
	}

	if (stored.status === "invalid") {
		const created = await createMemoryKey()
		writeEnvelope(created.id, [])
		return {
			key: created.key,
			keyId: created.id,
			notice:
				"Saved vault data did not match the expected record shape, so it was removed.",
			records: [],
			status: "unlocked"
		}
	}

	if (memoryKey?.id === stored.envelope.keyId) {
		return {
			key: memoryKey.key,
			keyId: memoryKey.id,
			notice: null,
			records: stored.envelope.items,
			status: "unlocked"
		}
	}

	return { itemCount: stored.envelope.items.length, status: "locked" }
}

export function bootVault() {
	bootPromise ??= bootVaultOnce()
	return bootPromise
}

export function lockVault() {
	memoryKey = null
	bootPromise = null
}

export async function startVaultSession() {
	lockVault()
	const created = await createMemoryKey()
	writeEnvelope(created.id, [])
	return created
}

export function persistVault(keyId: string, items: StoredVaultItem[]) {
	writeEnvelope(keyId, items)
}
