import { getInitials } from "@keynest/shared"
import { LockKeyhole, Search } from "lucide-react"

import { useVault } from "@/components/dashboard/vault-context"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import ToggleTheme from "@/components/ui/toggle-theme"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

export default function SiteHeader({
	onSearch
}: Readonly<{
	onSearch: () => void
}>) {
	const user = useAppSelector(selectUser)
	const vault = useVault()
	const locked = vault.status !== "unlocked"

	return (
		<header className="navbar justify-between gap-3 border-b border-base-300 bg-base-100 px-5 sm:px-8">
			<div className="flex min-w-0 items-center gap-3">
				<div className="lg:hidden">
					<Logo name />
				</div>
				<div className="hidden items-center gap-2 text-sm text-base-content/60 lg:flex">
					<LockKeyhole
						className={locked ? "size-4 text-warning" : "size-4 text-success"}
					/>
					{locked ? "Vault locked" : "Encrypted in this tab"}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button onClick={onSearch} type="button" variant="outline">
					<Search />
					<span className="hidden sm:inline">Search</span>
					<kbd className="kbd hidden kbd-sm md:inline">⌘K</kbd>
				</Button>
				<ToggleTheme />
				<div className="sm:hidden">
					<Avatar>{getInitials(user?.name ?? "")}</Avatar>
				</div>
			</div>
		</header>
	)
}
