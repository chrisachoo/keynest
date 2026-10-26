import { createVaultItemsApi } from "@keynest/client"

import { client } from "@/lib/client"

export const {
	createVaultItem,
	deleteVaultItem,
	importVaultItems,
	listVaultItems,
	setVaultItemFavorite
} = createVaultItemsApi(client)
