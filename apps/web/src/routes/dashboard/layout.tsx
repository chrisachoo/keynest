import { Outlet } from "react-router"

import AppSidebar from "@/components/dashboard/app-sidebar"
import MobileMenu from "@/components/dashboard/mobile-menu"
import SiteHeader from "@/components/dashboard/site-header"

export function Component() {
	return (
		<div className="drawer min-h-screen bg-base-100 text-base-content antialiased lg:drawer-open">
			<input className="drawer-toggle" id="app-drawer" type="checkbox" />
			<div className="drawer-content flex min-h-screen flex-col pb-16 lg:pb-0">
				<SiteHeader />
				<Outlet />
				<MobileMenu />
			</div>
			<div className="drawer-side">
				<label
					aria-label="close sidebar"
					className="drawer-overlay"
					htmlFor="app-drawer"
				/>
				<AppSidebar />
			</div>
		</div>
	)
}
