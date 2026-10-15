import {
	UnlockInputSchema,
	VAULT_IDLE_MS,
	VaultDraftSchema,
	type VaultItemType
} from "@keynest/shared"
import {
	draftPayload,
	message,
	openVaultRecords,
	sealPayload
} from "@keynest/utils"
import { useCallback, useEffect, useRef, useState } from "react"
import { Outlet, useFetcher, type ActionFunctionArgs } from "react-router"
import * as v from "valibot"

import AddItemDialog from "@/components/dashboard/add-item"
import AppSidebar from "@/components/dashboard/app-sidebar"
import MobileMenu from "@/components/dashboard/mobile-menu"
import SiteHeader from "@/components/dashboard/site-header"
import VaultSearch from "@/components/dashboard/vault-search"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { useDisclosure } from "@/hooks/use-disclosure"
import {
	DASHBOARD_ACTION,
	useVault,
	type DashboardOutletContext,
	type VaultActionData
} from "@/hooks/use-vault"
import { useVaultSearchShortcut } from "@/hooks/use-vault-search-shortcut"
import { requireAuth } from "@/lib/guards"
import {
	createVaultItem,
	deleteVaultItem,
	listVaultItems,
	setVaultItemFavorite
} from "@/lib/vault-api"
import {
	getVaultGeneration,
	getVaultKey,
	installVaultKey,
	lockVault
} from "@/lib/vault-session"
import { store } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

const intents = ["create", "delete", "favorite", "lock", "unlock"] as const

function field(formData: FormData, key: string) {
	const value = formData.get(key)
	return typeof value === "string" ? value : ""
}

function isIntent(value: string): value is (typeof intents)[number] {
	return intents.some((intent) => intent === value)
}

async function unlockVault(formData: FormData): Promise<VaultActionData> {
	const parsed = v.safeParse(UnlockInputSchema, {
		password: field(formData, "password")
	})
	if (!parsed.success)
		return { error: "Enter your password.", intent: "unlock" }

	const user = selectUser(store.getState())
	if (!user) return { error: "Log in again.", intent: "unlock" }

	const stamp = getVaultGeneration()
	const key = await installVaultKey(parsed.output.password, user)
	if (stamp !== getVaultGeneration() || !key) return { intent: "unlock" }
	return { intent: "unlock" }
}

async function createItem(formData: FormData): Promise<VaultActionData> {
	const key = getVaultKey()
	if (!key)
		return { error: "Unlock the vault before saving.", intent: "create" }

	const type = field(formData, "type")
	const parsed = v.safeParse(VaultDraftSchema, {
		name: field(formData, "name"),
		secret: field(formData, "secret"),
		type,
		username: type === "secure_note" ? "" : field(formData, "username")
	})
	if (!parsed.success)
		return { error: "Check the item details.", intent: "create" }

	const payload = draftPayload(parsed.output)
	const id = crypto.randomUUID()
	const sealed = await sealPayload(key, id, payload)
	await createVaultItem({
		ciphertext: sealed.ciphertext,
		favorite: false,
		id,
		nonce: sealed.nonce,
		type: payload.type
	})
	return { intent: "create" }
}

async function removeItem(formData: FormData): Promise<VaultActionData> {
	const id = field(formData, "id")
	if (!id) return { error: "Item not found.", intent: "delete" }
	await deleteVaultItem(id)
	return { intent: "delete" }
}

async function favoriteItem(formData: FormData): Promise<VaultActionData> {
	const id = field(formData, "id")
	if (!id) return { error: "Item not found.", intent: "favorite" }
	await setVaultItemFavorite(id, field(formData, "favorite") === "true")
	return { intent: "favorite" }
}

export async function loader() {
	await requireAuth()
	const key = getVaultKey()

	try {
		const records = await listVaultItems()
		if (!key) {
			return {
				itemCount: records.length,
				items: [],
				notice: null,
				status: "locked" as const
			}
		}

		return {
			itemCount: records.length,
			items: await openVaultRecords(key, records),
			notice: null,
			status: "unlocked" as const
		}
	} catch {
		if (!key) {
			return {
				itemCount: 0,
				items: [],
				notice: null,
				status: "locked" as const
			}
		}

		return {
			itemCount: 0,
			items: [],
			notice: "Could not load vault items.",
			status: "unlocked" as const
		}
	}
}

export async function action({
	request
}: ActionFunctionArgs): Promise<VaultActionData> {
	await requireAuth()
	const formData = await request.formData()
	const intent = field(formData, "intent")

	try {
		switch (intent) {
			case "unlock":
				return await unlockVault(formData)
			case "lock":
				lockVault()
				return { intent: "lock" }
			case "create":
				return await createItem(formData)
			case "delete":
				return await removeItem(formData)
			case "favorite":
				return await favoriteItem(formData)
			default:
				return { error: "Unknown action." }
		}
	} catch (error) {
		if (error instanceof Response) throw error
		return {
			error: message(error),
			intent: isIntent(intent) ? intent : undefined
		}
	}
}

function VaultSessionWatcher() {
	const { status } = useVault()
	const fetcher = useFetcher()
	const submit = useRef(fetcher.submit)

	useEffect(() => {
		submit.current = fetcher.submit
	})

	const lock = useCallback(() => {
		if (status !== "unlocked") return
		void submit.current(
			{ intent: "lock" },
			{ action: DASHBOARD_ACTION, method: "post" }
		)
	}, [status])

	useEffect(() => {
		function onVisibility() {
			if (document.visibilityState === "hidden") lock()
		}

		document.addEventListener("visibilitychange", onVisibility)
		return () => document.removeEventListener("visibilitychange", onVisibility)
	}, [lock])

	useEffect(() => {
		if (status !== "unlocked") return

		let timer = globalThis.setTimeout(lock, VAULT_IDLE_MS)
		const bump = () => {
			globalThis.clearTimeout(timer)
			timer = globalThis.setTimeout(lock, VAULT_IDLE_MS)
		}
		const events = ["keydown", "pointerdown", "wheel"] as const
		for (const event of events) globalThis.addEventListener(event, bump)

		return () => {
			globalThis.clearTimeout(timer)
			for (const event of events) globalThis.removeEventListener(event, bump)
		}
	}, [lock, status])

	return null
}

export function Component() {
	const vault = useVault()
	const [composerOpen, setComposerOpen] = useState(false)
	const [composerType, setComposerType] = useState<VaultItemType>("login")
	const [searchOpen, { close: closeSearch, toggle: toggleSearch }] =
		useDisclosure()
	useVaultSearchShortcut(toggleSearch)

	const openComposer = useCallback(
		(type: VaultItemType = "login") => {
			if (vault.status !== "unlocked") return
			setComposerType(type)
			setComposerOpen(true)
		},
		[vault.status]
	)
	const closeComposer = useCallback(() => {
		setComposerOpen(false)
	}, [])

	const outletContext = { openComposer } satisfies DashboardOutletContext

	return (
		<Drawer
			className="min-h-screen bg-base-100 text-base-content antialiased lg:drawer-open"
			id="app-drawer"
		>
			<DrawerContent className="flex min-h-screen flex-col pb-16 lg:pb-0">
				<SiteHeader onSearch={toggleSearch} />
				<Outlet context={outletContext} />
				<MobileMenu />
				<VaultSearch onClose={closeSearch} open={searchOpen} />
				<AddItemDialog
					defaultType={composerType}
					onClose={closeComposer}
					open={composerOpen}
				/>
				<VaultSessionWatcher />
			</DrawerContent>
			<DrawerSide className="z-40" closeLabel="Close sidebar">
				<AppSidebar />
			</DrawerSide>
		</Drawer>
	)
}
