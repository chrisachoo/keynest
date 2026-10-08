import * as v from "valibot"

import { VAULT_ITEM_TYPES } from "../constants"
import { NameSchema } from "./auth"
import { id, isoDateTime } from "./common"

export const vaultItemType = v.picklist(VAULT_ITEM_TYPES)

export type VaultItemType = v.InferOutput<typeof vaultItemType>

export const vaultItemIdParam = v.object({
	id
})

export const listVaultItemsQuery = v.object({
	type: v.optional(vaultItemType)
})

export const CreateVaultItemSchema = v.object({
	ciphertext: v.pipe(v.string(), v.minLength(1)),
	favorite: v.boolean(),
	id: v.pipe(v.string(), v.uuid()),
	nonce: v.pipe(v.string(), v.minLength(1)),
	type: vaultItemType
})

export const updateVaultItem = v.union([
	v.object({
		favorite: v.boolean()
	}),
	v.object({
		ciphertext: v.pipe(v.string(), v.minLength(1)),
		nonce: v.pipe(v.string(), v.minLength(1))
	})
])

export const VaultItemSchema = v.object({
	ciphertext: v.string(),
	createdAt: isoDateTime,
	favorite: v.boolean(),
	id: v.string(),
	nonce: v.string(),
	type: vaultItemType,
	updatedAt: isoDateTime,
	userId: v.string()
})

export const AddItemSchema = v.variant("type", [
	v.object({
		name: NameSchema,
		note: v.string(),
		type: v.literal("login"),
		username: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, "Username or email is required."),
			v.maxLength(320)
		)
	}),
	v.object({
		name: NameSchema,
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
	items: v.array(VaultItemSchema)
})

export type CreateVaultItem = v.InferOutput<typeof CreateVaultItemSchema>
export type UpdateVaultItem = v.InferOutput<typeof updateVaultItem>
export type VaultItem = v.InferOutput<typeof VaultItemSchema>
export type VaultItemList = v.InferOutput<typeof VaultItemListSchema>
export type AddItem = v.InferOutput<typeof AddItemSchema>
