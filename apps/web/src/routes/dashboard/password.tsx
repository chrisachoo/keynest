import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import { useVault } from "@/components/dashboard/vault-context"
import PasswordGenerator from "@/components/password-generator"
import { Button } from "@/components/ui/button"

export function Component() {
	const vault = useVault()

	return (
		<DashboardWrapper
			actions={
				<Button
					disabled={vault.status !== "unlocked"}
					onClick={() => vault.openComposer("login")}
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
