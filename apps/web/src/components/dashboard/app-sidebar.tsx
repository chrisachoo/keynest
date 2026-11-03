import { getInitials } from "@keynest/utils"
import {
	ChevronsUpDown,
	FolderLock,
	Settings,
	Star,
	StickyNote,
	UserKey,
	UserRound,
	WandSparkles,
	type LucideIcon
} from "lucide-react"
import { Link, useLocation } from "react-router"

import AccountMenu from "@/components/dashboard/account-menu"
import { Avatar } from "@/components/ui/avatar"
import Logo from "@/components/ui/logo"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

const itemsMenu = {
	"personal-vaults": [
		{ icon: FolderLock, label: "Vault", to: "/dashboard" },
		{ icon: UserKey, label: "Logins", to: "/dashboard?view=logins" },
		{ icon: Star, label: "Favorites", to: "/dashboard/favorites" },
		{ icon: StickyNote, label: "Secure notes", to: "/dashboard/notes" }
	],
	"your-activity": [
		{
			icon: WandSparkles,
			label: "Password generator",
			to: "/dashboard/password"
		}
	],
	"your-account": [
		{ icon: UserRound, label: "Account", to: "/dashboard/account" },
		{ icon: Settings, label: "Settings", to: "/dashboard/settings" }
	]
} as const

function isMenuActive(to: string, pathname: string, search: string) {
	const [path, query = ""] = to.split("?")
	if (pathname !== path) return false

	const expected = new URLSearchParams(query)
	const current = new URLSearchParams(search)
	if ([...expected.keys()].length === 0) return !current.get("view")

	for (const [key, value] of expected) {
		if (current.get(key) !== value) return false
	}

	return true
}

function MenuLink({
	icon: Icon,
	label,
	to
}: Readonly<{
	icon: LucideIcon
	label: string
	to: string
}>) {
	const location = useLocation()
	const active = isMenuActive(to, location.pathname, location.search)

	return (
		<li>
			<Link
				aria-current={active ? "page" : undefined}
				className={active ? "active" : undefined}
				to={to}
			>
				<Icon className="size-4" />
				<span className="min-w-0 flex-1 truncate">{label}</span>
			</Link>
		</li>
	)
}

export default function AppSidebar() {
	const user = useAppSelector(selectUser)

	return (
		<aside className="flex min-h-dvh w-72 flex-col bg-base-200 p-4 text-base-content">
			<Logo name />

			<ul className="menu mt-4 w-full flex-1 space-y-2 p-0">
				<li>
					<h2 className="menu-title uppercase">personal vaults</h2>
					<ul>
						{itemsMenu["personal-vaults"].map((item) => (
							<MenuLink key={item.label} {...item} />
						))}
					</ul>
				</li>

				<li>
					<h2 className="menu-title uppercase">your account</h2>
					<ul>
						{itemsMenu["your-account"].map((item) => (
							<MenuLink key={item.label} {...item} />
						))}
					</ul>
				</li>

				<li>
					<h2 className="menu-title uppercase">your activity</h2>
					<ul>
						{itemsMenu["your-activity"].map((item) => (
							<MenuLink key={item.label} {...item} />
						))}
					</ul>
				</li>
			</ul>

			<div className="z-50 flex items-center gap-2">
				<Avatar>{getInitials(user?.name ?? "")}</Avatar>

				<div className="min-w-0 flex-1">
					<p className="truncate text-xs font-medium">{user?.name}</p>
					<p className="truncate text-xs text-base-content/60">{user?.email}</p>
				</div>

				<AccountMenu
					label="Account menu"
					triggerClassName="btn btn-square btn-ghost btn-sm"
					className="dropdown-end dropdown-top"
				>
					<ChevronsUpDown className="size-4" />
				</AccountMenu>
			</div>
		</aside>
	)
}
