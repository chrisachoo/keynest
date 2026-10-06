import { Outlet } from "react-router"

import AuthPanel from "@/components/auth/auth-panel"

export function Component() {
	return (
		<main className="h-screen w-full">
			<div className="grid h-screen gap-2 md:grid-cols-sidebar-layout">
				<div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
					<Outlet />
				</div>

				<AuthPanel />
			</div>
		</main>
	)
}
