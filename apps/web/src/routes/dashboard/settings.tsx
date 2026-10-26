import { PasswordSchema, VAULT_IDLE_MS } from "@keynest/shared"
import { accountVerifier, errorMessage, message } from "@keynest/utils"
import { useFetcher, type ActionFunctionArgs } from "react-router"
import * as v from "valibot"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import RoutingTabs from "@/components/dashboard/routing-tabs"
import SessionList, {
	type SettingsActionData,
	type SettingsLoaderData
} from "@/components/dashboard/session-list"
import UnlockVault from "@/components/dashboard/unlock-vault"
import VaultDataSettings from "@/components/dashboard/vault-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/ui/countdown"
import { DASHBOARD_ACTION, useVault } from "@/hooks/use-vault"
import { client } from "@/lib/client"
import { store } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

const idleMinutes = VAULT_IDLE_MS / 60_000

function field(formData: FormData, key: string) {
	const value = formData.get(key)
	return typeof value === "string" ? value : ""
}

export async function loader(): Promise<SettingsLoaderData> {
	const response = await client.sessions.$get()
	if (!response.ok) throw new Error(await errorMessage(response))
	const body = await response.json()
	return { sessions: body.sessions }
}

export async function action({
	request
}: ActionFunctionArgs): Promise<SettingsActionData> {
	const formData = await request.formData()
	const intent = field(formData, "intent")

	try {
		if (intent === "revoke-others") {
			const user = selectUser(store.getState())
			if (!user) return { error: "Log in again.", intent: "revoke-others" }
			const parsed = v.safeParse(PasswordSchema, field(formData, "password"))
			if (!parsed.success)
				return { error: "Enter your password.", intent: "revoke-others" }
			const verifier = await accountVerifier(parsed.output, user)
			const response = await client.sessions["revoke-others"].$post({
				json: { verifier }
			})
			if (!response.ok) throw new Error(await errorMessage(response))
			return { intent: "revoke-others" }
		}

		if (intent === "revoke") {
			const id = field(formData, "id")
			if (!id) return { error: "Missing session.", intent: "revoke" }
			const response = await client.sessions[":id"].$delete({
				param: { id }
			})
			if (!response.ok) throw new Error(await errorMessage(response))
			return { intent: "revoke" }
		}

		return { error: "Unknown action." }
	} catch (error) {
		if (error instanceof Response) throw error
		return {
			error: message(error),
			intent:
				intent === "revoke" || intent === "revoke-others" ? intent : undefined
		}
	}
}

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
			description="Manage your active vault session, devices, and encrypted data."
			title="Settings"
		>
			<RoutingTabs />

			<div className="rounded-box border border-base-300 bg-base-100 p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="font-semibold">Vault session</h2>
						<p className="mt-1 text-sm text-base-content/70">
							Your password unwraps the vault key in this tab. The server stores
							ciphertext only.
						</p>
					</div>
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
			<VaultDataSettings />
		</DashboardWrapper>
	)
}
