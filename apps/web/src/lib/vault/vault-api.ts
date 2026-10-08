import { type CreateVaultItem, type VaultItem } from "@keynest/shared"
import { errorMessage } from "@keynest/utils"

import { client } from "@/lib/client"
import type { StoredVaultItem } from "@/lib/vault/vault-crypto"

function withoutUser(item: VaultItem): StoredVaultItem {
	const { userId: _userId, ...stored } = item
	return stored
}

export async function listVaultItems() {
	const response = await client["vault-items"].$get({ query: {} })
	if (!response.ok) throw new Error(await errorMessage(response))
	const body = await response.json()
	return body.items.map(withoutUser)
}

export async function createVaultItem(input: CreateVaultItem) {
	const response = await client["vault-items"].$post({ json: input })
	if (!response.ok) throw new Error(await errorMessage(response))
	return withoutUser(await response.json())
}

export async function deleteVaultItem(id: string) {
	const response = await client["vault-items"][":id"].$delete({
		param: { id }
	})
	if (!response.ok) throw new Error(await errorMessage(response))
}

export async function setVaultItemFavorite(id: string, favorite: boolean) {
	const response = await client["vault-items"][":id"].$patch({
		json: { favorite },
		param: { id }
	})
	if (!response.ok) throw new Error(await errorMessage(response))
	return withoutUser(await response.json())
}

export async function confirmVaultPassword(password: string) {
	const response = await client.auth.unlock.$post({ json: { password } })
	if (!response.ok) throw new Error(await errorMessage(response))
}
