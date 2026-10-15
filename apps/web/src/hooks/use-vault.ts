import type { VaultItemType, VaultItemView } from "@keynest/shared"
import { useOutletContext, useRouteLoaderData } from "react-router"

export const DASHBOARD_ACTION = "/dashboard"
export const DASHBOARD_ROUTE_ID = "dashboard"

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
	openComposer: (type?: VaultItemType) => void
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
