import { PasswordSchema, type SessionInfo } from "@keynest/shared"
import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { useFetcher, useLoaderData } from "react-router"
import * as v from "valibot"

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
	const [baseline, setBaseline] = useState<SettingsActionData | undefined>()

	const othersPending = revokeOthers.state !== "idle"
	const error = revokeOthers.data?.error ?? revoke.data?.error
	const showConfirm =
		confirming &&
		(othersPending ||
			revokeOthers.data === baseline ||
			Boolean(revokeOthers.data?.error))

	const revokeOthersForm = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			await revokeOthers.submit(
				{ intent: "revoke-others", password: value.password },
				{ action: SETTINGS_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: v.object({ password: PasswordSchema })
		}
	})

	return (
		<section className="rounded-box border border-base-300 bg-base-100 p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="font-semibold">Other devices</h2>
				{showConfirm ? (
					<form
						className="flex w-full max-w-sm flex-col gap-3"
						onSubmit={(event) => {
							event.preventDefault()
							event.stopPropagation()
							void revokeOthersForm.handleSubmit()
						}}
					>
						<revokeOthersForm.Field name="password">
							{(field) => (
								<Fieldset className="p-0">
									<Legend>Password</Legend>
									<Input
										autoComplete="current-password"
										disabled={othersPending}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										required
										type="password"
										value={field.state.value}
									/>
									{field.state.meta.errors.flatMap((item) => {
										const message = item?.message
										if (!message) return []
										return [
											<p className="text-sm text-error" key={message}>
												{message}
											</p>
										]
									})}
								</Fieldset>
							)}
						</revokeOthersForm.Field>
						<div className="flex flex-wrap gap-2">
							<revokeOthersForm.Subscribe
								selector={(state) => ({
									canSubmit: state.canSubmit,
									password: state.values.password
								})}
							>
								{({ canSubmit, password }) => (
									<Button
										disabled={othersPending || !canSubmit || !password}
										type="submit"
										variant="outline"
									>
										{othersPending
											? "Signing out..."
											: "Sign out other devices"}
									</Button>
								)}
							</revokeOthersForm.Subscribe>
							<Button
								disabled={othersPending}
								onClick={() => {
									setConfirming(false)
									revokeOthersForm.reset()
								}}
								type="button"
								variant="ghost"
							>
								Cancel
							</Button>
						</div>
					</form>
				) : (
					<Button
						onClick={() => {
							setBaseline(revokeOthers.data)
							revokeOthersForm.reset()
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
								<revoke.Form
									action={SETTINGS_ACTION}
									className="contents"
									method="post"
								>
									<input name="intent" type="hidden" value="revoke" />
									<input name="id" type="hidden" value={item.id} />
									<Button disabled={pending} type="submit" variant="ghost">
										{pending ? "Signing out..." : "Sign out"}
									</Button>
								</revoke.Form>
							)}
						</li>
					)
				})}
			</ul>
		</section>
	)
}
