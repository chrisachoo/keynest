import { useEffect } from "react"
import { Outlet } from "react-router"

import AddItemDialog from "@/components/dashboard/add-item"
import AppSidebar from "@/components/dashboard/app-sidebar"
import MobileMenu from "@/components/dashboard/mobile-menu"
import SiteHeader from "@/components/dashboard/site-header"
import { useVault } from "@/components/dashboard/vault-context"
import { VaultProvider } from "@/components/dashboard/vault-provider"
import VaultSearch from "@/components/dashboard/vault-search"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { useDisclosure } from "@/hooks/use-disclosure"

export function Component() {
	return (
		<VaultProvider>
			<DashboardShell />
		</VaultProvider>
	)
}

function useVaultSearchShortcut(onToggle: () => void) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() !== "k") return
			if (!event.metaKey && !event.ctrlKey) return
			event.preventDefault()
			onToggle()
		}

		globalThis.addEventListener("keydown", onKeyDown)
		return () => globalThis.removeEventListener("keydown", onKeyDown)
	}, [onToggle])
}

function DashboardShell() {
	const vault = useVault()
	const [searchOpen, { close: closeSearch, toggle: toggleSearch }] =
		useDisclosure()
	useVaultSearchShortcut(toggleSearch)

	return (
		<Drawer
			className="min-h-screen bg-base-100 text-base-content antialiased lg:drawer-open"
			id="app-drawer"
		>
			<DrawerContent className="flex min-h-screen flex-col pb-16 lg:pb-0">
				<SiteHeader onSearch={toggleSearch} />
				<Outlet />
				<MobileMenu />
				<VaultSearch onClose={closeSearch} open={searchOpen} />
				<AddItemDialog
					defaultType={vault.composerType}
					onClose={vault.closeComposer}
					onSubmit={vault.saveItem}
					open={vault.composerOpen}
				/>
			</DrawerContent>
			<DrawerSide className="z-40" closeLabel="Close sidebar">
				<AppSidebar />
			</DrawerSide>
		</Drawer>
	)
}
