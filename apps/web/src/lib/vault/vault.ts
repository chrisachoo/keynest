import { useOutletContext, useRouteLoaderData } from "react-router"

import type { StoredVaultItem, VaultPayload } from "@/lib/vault/vault-crypto"
import { openPayload } from "@/lib/vault/vault-crypto"

export const DASHBOARD_ACTION = "/dashboard"
export const DASHBOARD_ROUTE_ID = "dashboard"

export type OpenVaultItem = {
	createdAt: string
	favorite: boolean
	id: string
	name: string
	secret: string
	status: "open"
	type: VaultPayload["type"]
	updatedAt: string
	username: string
}

export type TamperedVaultItem = {
	createdAt: string
	favorite: boolean
	id: string
	status: "tampered"
	type: StoredVaultItem["type"]
	updatedAt: string
}

export type VaultItemView = OpenVaultItem | TamperedVaultItem

export type VaultLoaderData = {
	itemCount: number
	items: VaultItemView[]
	notice: string | null
	status: "locked" | "unlocked"
}

export type VaultActionData = {
	error?: string
	intent?: "create" | "delete" | "favorite" | "lock" | "unlock"
}

export type DashboardOutletContext = {
	openComposer: (type?: VaultPayload["type"]) => void
}

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
					createdAt: record.createdAt,
					favorite: record.favorite,
					id: record.id,
					name: payload.name,
					secret: payload.secret,
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

export function useVault() {
	const data = useRouteLoaderData(DASHBOARD_ROUTE_ID) as
		| VaultLoaderData
		| undefined
	if (!data) throw new Error("Vault data is unavailable")
	return data
}

export function useOpenComposer() {
	const value = useOutletContext<DashboardOutletContext | undefined>()
	if (!value) throw new Error("Composer controls are unavailable")
	return value.openComposer
}
