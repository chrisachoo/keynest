import { VAULT_IDLE_MS } from "@keynest/shared"
import { useFetcher } from "react-router"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import SessionList from "@/components/dashboard/session-list"
import UnlockVault from "@/components/dashboard/unlock-vault"
import VaultSecurity from "@/components/dashboard/vault-security"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/ui/countdown"
import { DASHBOARD_ACTION, useVault } from "@/hooks/use-vault"

const idleMinutes = VAULT_IDLE_MS / 60_000

function LockButton({ disabled }: Readonly<{ disabled: boolean }>) {
	const fetcher = useFetcher()
	const pending = fetcher.state !== "idle"

	return (
		<fetcher.Form action={DASHBOARD_ACTION} method="post">
			<input name="intent" type="hidden" value="lock" />
			<Button disabled={disabled || pending} type="submit" variant="outline">
				{pending ? "Locking..." : "Lock vault"}
			</Button>
		</fetcher.Form>
	)
}

export function Component() {
	const vault = useVault()
	const locked = vault.status === "locked"

	return (
		<DashboardWrapper
			description="Your password unwraps the vault key in this tab. The server stores ciphertext only."
			title="Settings"
		>
			<div className="rounded-box border border-base-300 bg-base-100 p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-semibold">Session</h2>
					<Badge variant={locked ? "warning" : "success"}>
						{locked ? "Locked" : "Unlocked"}
					</Badge>
				</div>

				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					{vault.itemCount} encrypted {vault.itemCount === 1 ? "item" : "items"}
					. Sign-in ends in <Countdown />. Leaving this tab, or leaving it idle
					for {idleMinutes} minutes, locks the vault until you enter your
					password again.
				</p>

				<div className="mt-4">
					{locked ? (
						<UnlockVault />
					) : (
						<LockButton disabled={vault.status !== "unlocked"} />
					)}
				</div>
			</div>
			<SessionList />
			<VaultSecurity />
		</DashboardWrapper>
	)
}
