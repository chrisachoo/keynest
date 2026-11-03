import type { ReactNode } from "react"

import AuthPanel, { type AuthPanelMode } from "@/components/auth/auth-panel"

export default function AuthShell({
	children,
	panel = "default"
}: Readonly<{
	children: ReactNode
	panel?: AuthPanelMode
}>) {
	return (
		<main className="h-screen w-full">
			<div className="grid h-screen gap-2 md:grid-cols-sidebar-layout">
				<div className="flex items-center justify-center overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
					{children}
				</div>
				<AuthPanel mode={panel} />
			</div>
		</main>
	)
}
