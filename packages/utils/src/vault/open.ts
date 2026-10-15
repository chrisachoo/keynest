import type {
	OpenVaultItem,
	StoredVaultItem,
	TamperedVaultItem,
	VaultItemView
} from "@keynest/shared"

import { openPayload } from "./crypto"

function byUpdatedAt(left: VaultItemView, right: VaultItemView) {
	return right.updatedAt.localeCompare(left.updatedAt)
}

export async function openVaultRecords(
	key: CryptoKey,
	records: StoredVaultItem[]
) {
	const items = await Promise.all(
		records.map(async (record) => {
			try {
				const payload = await openPayload(key, record)
				return {
					ciphertext: record.ciphertext,
					createdAt: record.createdAt,
					favorite: record.favorite,
					id: record.id,
					name: payload.name,
					nonce: record.nonce,
					status: "open",
					type: payload.type,
					updatedAt: record.updatedAt,
					username: payload.username
				} satisfies OpenVaultItem
			} catch {
				return {
					createdAt: record.createdAt,
					favorite: record.favorite,
					id: record.id,
					status: "tampered",
					type: record.type,
					updatedAt: record.updatedAt
				} satisfies TamperedVaultItem
			}
		})
	)

	return items.toSorted(byUpdatedAt)
}
