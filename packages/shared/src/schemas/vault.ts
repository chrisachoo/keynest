import * as v from "valibot"

import {
	PAYLOAD_VERSION,
	VAULT_CIPHERTEXT_MAX,
	VAULT_EXPORT_VERSION,
	VAULT_ITEM_TYPES
} from "../constants"
import {
	KdfFields,
	NameFieldSchema,
	SecretFieldSchema,
	VaultWrapFields
} from "./auth"
import { IdSchema, IsoDateTimeSchema } from "./common"

export const VaultItemTypeSchema = v.picklist(VAULT_ITEM_TYPES)

const UsernameFieldSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, "Username or email is required."),
	v.maxLength(320)
)
const CiphertextFieldSchema = v.pipe(
	v.string(),
	v.minLength(1),
	v.maxLength(VAULT_CIPHERTEXT_MAX)
)
const NonceFieldSchema = v.pipe(v.string(), v.minLength(16), v.maxLength(32))

const LoginDraftFields = {
	name: NameFieldSchema,
	secret: SecretFieldSchema,
	type: v.literal("login"),
	username: UsernameFieldSchema
}

const NoteDraftFields = {
	name: NameFieldSchema,
	secret: SecretFieldSchema,
	type: v.literal("secure_note"),
	username: v.literal("")
}

export const VaultDraftSchema = v.variant("type", [
	v.object(LoginDraftFields),
	v.object(NoteDraftFields)
])

export const VaultPayloadSchema = v.variant("type", [
	v.object({
		...LoginDraftFields,
		schemaVersion: v.literal(PAYLOAD_VERSION)
	}),
	v.object({
		...NoteDraftFields,
		schemaVersion: v.literal(PAYLOAD_VERSION)
	})
])

export const VaultItemIdParamSchema = v.object({
	id: IdSchema
})

export const VaultItemQuerySchema = v.object({
	cursor: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(80))),
	limit: v.optional(v.pipe(v.string(), v.regex(/^\d{1,3}$/))),
	type: v.optional(VaultItemTypeSchema)
})

export const CreateVaultItemSchema = v.object({
	ciphertext: CiphertextFieldSchema,
	favorite: v.boolean(),
	id: v.pipe(v.string(), v.uuid()),
	nonce: NonceFieldSchema,
	type: VaultItemTypeSchema
})

export const UpdateVaultItemSchema = v.union([
	v.object({
		favorite: v.boolean()
	}),
	v.object({
		ciphertext: CiphertextFieldSchema,
		nonce: NonceFieldSchema
	})
])

export const VaultItemSchema = v.object({
	ciphertext: v.string(),
	createdAt: IsoDateTimeSchema,
	favorite: v.boolean(),
	id: v.string(),
	nonce: v.string(),
	type: VaultItemTypeSchema,
	updatedAt: IsoDateTimeSchema,
	userId: v.string()
})

export const StoredVaultItemSchema = v.omit(VaultItemSchema, ["userId"])

export const OpenVaultItemSchema = v.object({
	ciphertext: v.string(),
	createdAt: IsoDateTimeSchema,
	favorite: v.boolean(),
	id: v.string(),
	name: v.string(),
	nonce: v.string(),
	status: v.literal("open"),
	type: VaultItemTypeSchema,
	updatedAt: IsoDateTimeSchema,
	username: v.string()
})

export const TamperedVaultItemSchema = v.object({
	createdAt: IsoDateTimeSchema,
	favorite: v.boolean(),
	id: v.string(),
	status: v.literal("tampered"),
	type: VaultItemTypeSchema,
	updatedAt: IsoDateTimeSchema
})

export const VaultItemViewSchema = v.variant("status", [
	OpenVaultItemSchema,
	TamperedVaultItemSchema
])

export const AddItemSchema = v.variant("type", [
	v.object({
		name: NameFieldSchema,
		note: v.string(),
		type: v.literal("login"),
		username: UsernameFieldSchema
	}),
	v.object({
		name: NameFieldSchema,
		note: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, "Note is required."),
			v.maxLength(8_000)
		),
		type: v.literal("secure_note"),
		username: v.string()
	})
])

export const VaultItemListSchema = v.object({
	items: v.array(VaultItemSchema),
	nextCursor: v.nullable(v.string())
})

export const VaultExportSchema = v.object({
	items: v.array(StoredVaultItemSchema),
	version: v.literal(VAULT_EXPORT_VERSION),
	...KdfFields,
	...VaultWrapFields
})

export type VaultItemType = v.InferOutput<typeof VaultItemTypeSchema>
export type VaultDraft = v.InferOutput<typeof VaultDraftSchema>
export type VaultPayload = v.InferOutput<typeof VaultPayloadSchema>
export type CreateVaultItem = v.InferOutput<typeof CreateVaultItemSchema>
export type UpdateVaultItem = v.InferOutput<typeof UpdateVaultItemSchema>
export type VaultItem = v.InferOutput<typeof VaultItemSchema>
export type StoredVaultItem = v.InferOutput<typeof StoredVaultItemSchema>
export type OpenVaultItem = v.InferOutput<typeof OpenVaultItemSchema>
export type TamperedVaultItem = v.InferOutput<typeof TamperedVaultItemSchema>
export type VaultItemView = v.InferOutput<typeof VaultItemViewSchema>
export type VaultItemList = v.InferOutput<typeof VaultItemListSchema>
export type AddItem = v.InferOutput<typeof AddItemSchema>
export type VaultExport = v.InferOutput<typeof VaultExportSchema>
