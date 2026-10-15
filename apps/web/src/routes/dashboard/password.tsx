import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import PasswordGenerator from "@/components/password-generator"
import { Button } from "@/components/ui/button"
import { useOpenComposer, useVault } from "@/hooks/use-vault"

export function Component() {
	const vault = useVault()
	const openComposer = useOpenComposer()

	return (
		<DashboardWrapper
			actions={
				<Button
					disabled={vault.status !== "unlocked"}
					onClick={() => openComposer("login")}
					type="button"
				>
					Add login
				</Button>
			}
			description="Create a password or passphrase, then save it as a login."
			title="Password generator"
		>
			<PasswordGenerator />
		</DashboardWrapper>
	)
}
