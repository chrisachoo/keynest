import { getInitials } from "@keynest/shared"
import { CircleHelp, LockKeyhole, Search } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import ToggleTheme from "@/components/ui/toggle-theme"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

export default function SiteHeader() {
	const user = useAppSelector(selectUser)

	return (
		<header className="navbar border-b border-base-300 bg-base-100 px-5 sm:px-8">
			<div className="navbar-start">
				<div className="lg:hidden">
					<Logo name />
				</div>
				<div className="hidden items-center gap-2 text-sm text-base-content/60 lg:flex">
					<LockKeyhole className="size-4 text-success" />
					Your vault is locked
				</div>
			</div>

			<div className="navbar-end gap-2">
				<Button
					className="hidden min-w-48 justify-between sm:inline-flex"
					type="button"
					variant="outline"
				>
					<span className="flex items-center gap-2">
						<Search />
						Search vault
					</span>
					<kbd className="kbd kbd-sm">⌘K</kbd>
				</Button>
				<Button
					aria-label="Search"
					className="sm:hidden"
					shape="square"
					type="button"
					variant="ghost"
				>
					<Search />
				</Button>
				<div className="tooltip tooltip-bottom tooltip-end">
					<Button variant="ghost" shape="square">
						<CircleHelp />
					</Button>

					<div className="tooltip-content w-64 space-y-1 border border-base-300 bg-base-200 p-4 text-start">
						<p className="text-sm font-semibold text-base-content">
							Using your vault
						</p>
						<p className="text-xs text-base-content/60">
							Search with ⌘K, generate a password from the sidebar, and open an
							item to copy its details.
						</p>
					</div>
				</div>

				<ToggleTheme />
				<div className="sm:hidden">
					<Avatar>{getInitials(user?.name ?? "")}</Avatar>
				</div>
			</div>
		</header>
	)
}
