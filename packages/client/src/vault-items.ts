import {
	type CreateVaultItem,
	type StoredVaultItem,
	type VaultItem
} from "@keynest/shared"
import { errorMessage } from "@keynest/utils"

import type { KeynestApiClient } from "./api-client"

function withoutUser(item: VaultItem): StoredVaultItem {
	const { userId: _userId, ...stored } = item
	return stored
}

export function createVaultItemsApi(client: KeynestApiClient) {
	async function listVaultPage(cursor?: string): Promise<StoredVaultItem[]> {
		const response = await client["vault-items"].$get({
			query: cursor ? { cursor, limit: "50" } : { limit: "50" }
		})
		if (!response.ok) throw new Error(await errorMessage(response))
		const body = await response.json()
		const items = body.items.map(withoutUser)
		if (!body.nextCursor) return items
		return [...items, ...(await listVaultPage(body.nextCursor))]
	}

	async function importOne(item: CreateVaultItem) {
		const response = await client["vault-items"].$post({ json: item })
		if (response.ok) return "imported" as const
		if (Number(response.status) === 409) return "skipped" as const
		throw new Error(await errorMessage(response))
	}

	return {
		async createVaultItem(input: CreateVaultItem) {
			const response = await client["vault-items"].$post({ json: input })
			if (!response.ok) throw new Error(await errorMessage(response))
			return withoutUser(await response.json())
		},
		async deleteVaultItem(id: string) {
			const response = await client["vault-items"][":id"].$delete({
				param: { id }
			})
			if (!response.ok) throw new Error(await errorMessage(response))
		},
		listVaultItems() {
			return listVaultPage()
		},
		async importVaultItems(items: CreateVaultItem[]) {
			const results = await Promise.all(items.map(importOne))
			return {
				imported: results.filter((result) => result === "imported").length,
				skipped: results.filter((result) => result === "skipped").length
			}
		},
		async setVaultItemFavorite(id: string, favorite: boolean) {
			const response = await client["vault-items"][":id"].$patch({
				json: { favorite },
				param: { id }
			})
			if (!response.ok) throw new Error(await errorMessage(response))
			return withoutUser(await response.json())
		}
	}
}

export type VaultItemsApi = ReturnType<typeof createVaultItemsApi>
