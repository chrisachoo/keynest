import * as v from "valibot"

import { VAULT_ITEM_TYPES } from "../constants"
import { id, isoDateTime } from "./common"

export const vaultItemType = v.picklist(VAULT_ITEM_TYPES)

export type VaultItemType = v.InferOutput<typeof vaultItemType>

export const vaultItemIdParam = v.object({
	id
})

export const listVaultItemsQuery = v.object({
	type: v.optional(vaultItemType)
})

export const createVaultItem = v.object({
	ciphertext: v.pipe(v.string(), v.minLength(1)),
	nonce: v.pipe(v.string(), v.minLength(1)),
	type: vaultItemType
})

export const updateVaultItem = v.object({
	ciphertext: v.pipe(v.string(), v.minLength(1)),
	nonce: v.pipe(v.string(), v.minLength(1))
})

export const vaultItem = v.object({
	ciphertext: v.string(),
	createdAt: isoDateTime,
	id: v.string(),
	nonce: v.string(),
	type: vaultItemType,
	updatedAt: isoDateTime,
	userId: v.string()
})

export const vaultItemList = v.object({
	items: v.array(vaultItem)
})

export type CreateVaultItem = v.InferOutput<typeof createVaultItem>
export type UpdateVaultItem = v.InferOutput<typeof updateVaultItem>
export type VaultItem = v.InferOutput<typeof vaultItem>
export type VaultItemList = v.InferOutput<typeof vaultItemList>
