import type { ReactNode } from "react"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import PasswordGenerator from "@/components/password-generator"
import { Button } from "@/components/ui/button"
import { toolCopy } from "@/constants"
import { useOpenComposer, useVault } from "@/hooks/use-vault"

export function ToolScreen({
	actions,
	children,
	description,
	title
}: Readonly<{
	actions?: ReactNode
	children: ReactNode
	description: string
	title: string
}>) {
	return (
		<DashboardWrapper actions={actions} description={description} title={title}>
			{children}
		</DashboardWrapper>
	)
}

export function Component() {
	const copy = toolCopy.password
	const vault = useVault()
	const openComposer = useOpenComposer()

	return (
		<ToolScreen
			actions={
				<Button
					disabled={vault.status !== "unlocked"}
					onClick={() => openComposer("login")}
					type="button"
				>
					Add login
				</Button>
			}
			description={copy.vaultDescription}
			title={copy.title}
		>
			<PasswordGenerator />
		</ToolScreen>
	)
}
