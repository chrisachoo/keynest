import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import { useVault } from "@/components/dashboard/vault-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Component() {
	const vault = useVault()
	const locked = vault.status === "locked"

	return (
		<DashboardWrapper
			description="This browser tab holds the key for your encrypted items."
			title="Settings"
		>
			<div className="rounded-box border border-base-300 bg-base-100 p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-semibold">Session</h2>
					<Badge variant={locked ? "warning" : "success"}>
						{vault.status === "loading"
							? "Checking"
							: locked
								? "Locked"
								: "Unlocked"}
					</Badge>
				</div>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					{vault.sessionCount} encrypted{" "}
					{vault.sessionCount === 1 ? "item" : "items"}. Each item is stored as
					type, ciphertext, and nonce. Locking drops the key for this tab.
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<Button
						disabled={vault.status !== "unlocked"}
						onClick={vault.lock}
						type="button"
						variant="outline"
					>
						Lock vault
					</Button>
					{locked ? (
						<Button onClick={() => void vault.startSession()} type="button">
							Start a new session
						</Button>
					) : null}
				</div>
			</div>
		</DashboardWrapper>
	)
}
