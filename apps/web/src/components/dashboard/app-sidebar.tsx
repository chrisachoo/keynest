import { getInitials } from "@keynest/shared"
import {
	ChevronsUpDown,
	FolderLock,
	LogOut,
	Settings,
	StickyNote,
	UserKey,
	WandSparkles,
	type LucideIcon
} from "lucide-react"
import { Link, NavLink, useLocation, useNavigate } from "react-router"

import { Avatar } from "@/components/ui/avatar"
import Logo from "@/components/ui/logo"
import { useAppDispatch, useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"
import { logoutAsync } from "@/store/auth/extra-reducers"

const itemsMenu = {
	"personal-vaults": [
		{ icon: FolderLock, label: "Vault", to: "/dashboard" },
		{ icon: UserKey, label: "Logins", to: "/dashboard?view=logins" },
		{ icon: StickyNote, label: "Secure notes", to: "/dashboard/notes" }
	],
	"your-activity": [
		{
			icon: WandSparkles,
			label: "Password generator",
			to: "/dashboard/password"
		},
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
	const dispatch = useAppDispatch()
	const location = useLocation()
	const navigate = useNavigate()
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
					<h2 className="menu-title uppercase">your activity</h2>
					<ul>
						{itemsMenu["your-activity"].map((item) => (
							<MenuLink key={item.label} {...item} />
						))}
					</ul>
				</li>
			</ul>

			<div className="flex items-center gap-2">
				<Avatar>{getInitials(user?.name ?? "")}</Avatar>

				<div className="min-w-0 flex-1">
					<p className="truncate text-xs font-medium">{user?.name}</p>
					<p className="truncate text-xs text-base-content/60">{user?.email}</p>
				</div>

				<button
					aria-label="Account menu"
					className="btn btn-square btn-ghost btn-sm"
					popoverTarget="profile"
					style={{ anchorName: "--anchor-1" }}
					type="button"
				>
					<ChevronsUpDown className="size-4" />
				</button>

				<ul
					className="menu dropdown w-56 rounded-box border border-base-300 bg-base-200"
					id="profile"
					popover="auto"
					style={{ positionAnchor: "--anchor-1" }}
				>
					<li>
						<Link
							className={
								location.pathname === "/dashboard/settings"
									? "active"
									: undefined
							}
							to="/dashboard/settings"
						>
							<Settings className="size-4" />
							<span className="min-w-0 flex-1 truncate">Settings</span>
						</Link>
					</li>

					<li>
						<NavLink
							onClick={async (event) => {
								event.preventDefault()
								document.getElementById("profile")?.hidePopover()

								const result = await dispatch(logoutAsync())

								if (logoutAsync.fulfilled.match(result)) {
									navigate("/login", { replace: true })
								}
							}}
							to="/login"
						>
							<LogOut className="size-4" />
							<span className="min-w-0 flex-1 truncate">Log out</span>
						</NavLink>
					</li>
				</ul>
			</div>
		</aside>
	)
}
