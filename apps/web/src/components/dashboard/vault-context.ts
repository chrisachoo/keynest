import { createContext, use } from "react"

import type {
	StoredVaultItem,
	VaultDraft,
	VaultPayload
} from "@/components/dashboard/vault-session"

export type OpenVaultItem = {
	createdAt: string
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
	id: string
	status: "tampered"
	type: StoredVaultItem["type"]
	updatedAt: string
}

export type VaultItemView = OpenVaultItem | TamperedVaultItem

export type VaultStatus = "loading" | "locked" | "unlocked"

export type VaultContextValue = {
	closeComposer: () => void
	composerOpen: boolean
	composerType: VaultPayload["type"]
	items: VaultItemView[]
	lock: () => void
	notice: string | null
	openComposer: (type?: VaultPayload["type"]) => void
	removeItem: (id: string) => void
	saveItem: (draft: VaultDraft) => Promise<void>
	sessionCount: number
	startSession: () => Promise<void>
	status: VaultStatus
}

export const VaultContext = createContext<VaultContextValue | null>(null)

export function useVault() {
	const value = use(VaultContext)
	if (!value) throw new Error("useVault must be used inside VaultProvider")
	return value
}
