import { useEffect } from "react"
import { Outlet } from "react-router"

import AddItemDialog from "@/components/dashboard/add-item"
import AppSidebar from "@/components/dashboard/app-sidebar"
import MobileMenu from "@/components/dashboard/mobile-menu"
import SiteHeader from "@/components/dashboard/site-header"
import { useVault } from "@/components/dashboard/vault-context"
import { VaultProvider } from "@/components/dashboard/vault-provider"
import VaultSearch from "@/components/dashboard/vault-search"
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
		<div className="drawer min-h-screen bg-base-100 text-base-content antialiased lg:drawer-open">
			<input className="drawer-toggle" id="app-drawer" type="checkbox" />
			<div className="drawer-content flex min-h-screen flex-col pb-16 lg:pb-0">
				<SiteHeader onSearch={toggleSearch} />
				<Outlet />
				<MobileMenu />
			</div>
			<div className="drawer-side z-40">
				<label
					aria-label="Close sidebar"
					className="drawer-overlay"
					htmlFor="app-drawer"
				/>
				<AppSidebar />
			</div>
			<VaultSearch onClose={closeSearch} open={searchOpen} />
			<AddItemDialog
				defaultType={vault.composerType}
				onClose={vault.closeComposer}
				onSubmit={vault.saveItem}
				open={vault.composerOpen}
			/>
		</div>
	)
}
