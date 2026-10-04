import {
	ChevronsUpDown,
	FolderLock,
	LogOut,
	Settings,
	ShieldCheck,
	Star,
	StickyNote,
	Zap,
	type LucideIcon
} from "lucide-react"
import { NavLink } from "react-router"

import { Avatar } from "@/components/ui/avatar"
import Logo from "@/components/ui/logo"
import Meter from "@/components/ui/meter"

const itemsMenu: {
	count?: number
	end?: boolean
	icon: LucideIcon
	label: string
	to: string
}[] = [
	{ end: true, icon: FolderLock, label: "Vault", to: "/dashboard" },
	{
		icon: Star,
		label: "Favorites",
		to: "/dashboard/favorites"
	},
	{ icon: StickyNote, label: "Secure notes", to: "/dashboard/notes" }
]

export default function AppSidebar() {
	return (
		<aside className="flex min-h-dvh w-72 flex-col bg-base-200 p-4 text-base-content">
			<Logo name />

			<ul className="menu mt-4 w-full flex-1 space-y-2 p-0">
				<li>
					<h2 className="menu-title">Vault</h2>

					<ul>
						{itemsMenu.map(({ icon: Icon, label, to, end }) => (
							<li key={label}>
								<NavLink end={end} to={to}>
									<Icon className="size-4" />
									<span className="min-w-0 flex-1 truncate">{label}</span>
								</NavLink>
							</li>
						))}
					</ul>
				</li>

				<li>
					<h2 className="menu-title">Workspace</h2>

					<ul>
						<li>
							<button type="button">
								<Zap className="size-4" />
								Password generator
							</button>
						</li>

						<li>
							<NavLink to="/dashboard/settings">
								<Settings className="size-4" />
								<span className="min-w-0 flex-1 truncate">Settings</span>
							</NavLink>
						</li>
					</ul>
				</li>
			</ul>

			<div className="space-y-2">
				<div className="card bg-base-100 card-sm card-border">
					<div className="card-body space-y-2">
						<div className="mbe-0 flex items-center justify-between">
							<span className="text-xs font-medium">Vault strength</span>
							<ShieldCheck className="size-4 text-success" />
						</div>

						<Meter caption="Great protection" level="veryStrong" />
					</div>
				</div>

				<div className="divider divide-base-300" />

				<div className="flex items-center gap-2">
					<Avatar>D</Avatar>

					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-medium">Daisy UI</p>
						<p className="truncate text-xs text-base-content/60">
							Personal vault
						</p>
					</div>

					<button
						className="btn btn-square btn-ghost btn-sm"
						aria-label="account menu"
						popoverTarget="profile"
						style={{ anchorName: "--anchor-1" }}
					>
						<ChevronsUpDown className="size-4" />
					</button>

					<ul
						className="menu dropdown w-56 rounded-box border border-base-300 bg-base-200"
						popover="auto"
						id="profile"
						style={{ positionAnchor: "--anchor-1" }}
					>
						<li>
							<NavLink to="/dashboard/settings">
								<Settings className="size-4" />
								<span className="min-w-0 flex-1 truncate">Settings</span>
							</NavLink>
						</li>

						<li>
							<NavLink to="/">
								<LogOut className="size-4" />
								<span className="min-w-0 flex-1 truncate">Log out</span>
							</NavLink>
						</li>
					</ul>
				</div>
			</div>
		</aside>
	)
}
