import type { ComponentProps } from "react"
import { NavLink } from "react-router"

const sections = [
	{ label: "Account", to: "/dashboard/account" },
	{ label: "Settings", to: "/dashboard/settings" }
] as const

export default function RoutingTabs({ children }: ComponentProps<"div">) {
	return (
		<div aria-label="account and settings" className="tabs tabs-lift w-fit">
			{sections.map(({ label, to }) => (
				<NavLink
					className={({ isActive }) => `tab${isActive ? " tab-active" : ""}`}
					key={to}
					to={to}
				>
					{label}
				</NavLink>
			))}

			{children}
		</div>
	)
}
