import { cn } from "cn"
import { LogOut, Settings, UserRound } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"

import { useAppDispatch } from "@/store"
import { logoutAsync } from "@/store/auth/extra-reducers"

export default function AccountMenu({
	children,
	label,
	triggerClassName,
	className
}: Readonly<{
	children: React.ReactNode
	label: string
	triggerClassName: string
	className?: string
}>) {
	const dispatch = useAppDispatch()
	const location = useLocation()
	const navigate = useNavigate()

	return (
		<div className={cn("dropdown", className)}>
			<button
				aria-label={label}
				className={triggerClassName}
				tabIndex={0}
				type="button"
			>
				{children}
			</button>
			<ul className="menu dropdown-content z-10 mt-3 w-56 menu-sm rounded-3xl border border-base-300 bg-base-200 p-2 shadow">
				<li>
					<Link
						aria-current={
							location.pathname === "/dashboard/account" ? "page" : undefined
						}
						className={
							location.pathname === "/dashboard/account" ? "active" : undefined
						}
						to="/dashboard/account"
					>
						<UserRound className="size-4" />
						<span className="min-w-0 flex-1 truncate">Account</span>
					</Link>
				</li>
				<li>
					<Link
						aria-current={
							location.pathname === "/dashboard/settings" ? "page" : undefined
						}
						className={
							location.pathname === "/dashboard/settings" ? "active" : undefined
						}
						to="/dashboard/settings"
					>
						<Settings className="size-4" />
						<span className="min-w-0 flex-1 truncate">Settings</span>
					</Link>
				</li>
				<li>
					<button
						onClick={async () => {
							const result = await dispatch(logoutAsync())

							if (logoutAsync.fulfilled.match(result)) {
								navigate("/login", { replace: true })
							}
						}}
						type="button"
					>
						<LogOut className="size-4" />
						<span className="min-w-0 flex-1 truncate">Log out</span>
					</button>
				</li>
			</ul>
		</div>
	)
}
