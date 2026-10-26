import type { SessionInfo } from "@keynest/shared"
import { useState } from "react"
import { useFetcher, useLoaderData } from "react-router"

import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"

export const SETTINGS_ACTION = "/dashboard/settings"

export type SettingsLoaderData = {
	sessions: SessionInfo[]
}

export type SettingsActionData = {
	error?: string
	intent?: "revoke" | "revoke-others"
}

export default function SessionList() {
	const { sessions } = useLoaderData() as SettingsLoaderData
	const revokeOthers = useFetcher<SettingsActionData>()
	const revoke = useFetcher<SettingsActionData>()
	const [confirming, setConfirming] = useState(false)
	const [password, setPassword] = useState("")
	const [baseline, setBaseline] = useState<SettingsActionData | undefined>()
	const othersPending = revokeOthers.state !== "idle"
	const error = revokeOthers.data?.error ?? revoke.data?.error
	const showConfirm =
		confirming &&
		(othersPending ||
			revokeOthers.data === baseline ||
			Boolean(revokeOthers.data?.error))

	return (
		<section className="rounded-box border border-base-300 bg-base-100 p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="font-semibold">Other devices</h2>
				{showConfirm ? (
					<div className="flex w-full max-w-sm flex-col gap-3">
						<Fieldset className="p-0">
							<Legend>Password</Legend>
							<Input
								autoComplete="current-password"
								disabled={othersPending}
								onChange={(event) => setPassword(event.target.value)}
								required
								type="password"
								value={password}
							/>
						</Fieldset>
						<div className="flex flex-wrap gap-2">
							<Button
								disabled={othersPending || !password}
								onClick={() => {
									void revokeOthers.submit(
										{ intent: "revoke-others", password },
										{ action: SETTINGS_ACTION, method: "post" }
									)
								}}
								type="button"
								variant="outline"
							>
								{othersPending ? "Signing out..." : "Sign out other devices"}
							</Button>
							<Button
								disabled={othersPending}
								onClick={() => {
									setConfirming(false)
									setPassword("")
								}}
								type="button"
								variant="ghost"
							>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<Button
						onClick={() => {
							setBaseline(revokeOthers.data)
							setPassword("")
							setConfirming(true)
						}}
						type="button"
						variant="outline"
					>
						Sign out other sessions
					</Button>
				)}
			</div>

			<p className="mt-2 max-w-2xl text-sm text-base-content/70">
				Password changes, recovery, and turning off two-factor authentication
				also sign out the other sessions.
			</p>

			{error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

			<ul className="mt-4 space-y-3">
				{sessions.map((item) => {
					const pending =
						revoke.state !== "idle" && revoke.formData?.get("id") === item.id

					return (
						<li
							className="flex flex-wrap items-center justify-between gap-3 text-sm"
							key={item.id}
						>
							<div className="min-w-0">
								<p className="truncate font-medium">
									{item.current
										? "This device"
										: (item.userAgent ?? "Unknown browser")}
								</p>
								<p className="text-base-content/60">
									{item.ipAddress ?? "Unknown IP"} · until{" "}
									{new Date(item.expiresAt).toLocaleString()}
								</p>
							</div>
							{item.current ? null : (
								<Button
									disabled={pending}
									onClick={() => {
										void revoke.submit(
											{ id: item.id, intent: "revoke" },
											{ action: SETTINGS_ACTION, method: "post" }
										)
									}}
									type="button"
									variant="ghost"
								>
									{pending ? "Signing out..." : "Sign out"}
								</Button>
							)}
						</li>
					)
				})}
			</ul>
		</section>
	)
}
