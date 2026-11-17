import type { SessionInfo } from "@keynest/shared"
import {
	Laptop,
	Monitor,
	ShieldAlert,
	Smartphone,
	Tablet,
	type LucideIcon
} from "lucide-react"
import { useId, useState } from "react"
import { useFetcher, useLoaderData } from "react-router"

import ConfirmDialog from "@/components/dashboard/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogTitle } from "@/components/ui/dialog"

export const SETTINGS_ACTION = "/dashboard/settings"

export type SettingsLoaderData = {
	sessions: SessionInfo[]
}

export type SettingsActionData = {
	error?: string
	intent?: "revoke" | "revoke-others"
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export default function SessionList() {
	const { sessions } = useLoaderData() as SettingsLoaderData
	const revokeOthers = useFetcher<SettingsActionData>()
	const revoke = useFetcher<SettingsActionData>()
	const titleId = useId()
	const [baseline, setBaseline] = useState<SettingsActionData | undefined>()
	const [confirming, setConfirming] = useState(false)
	const [locked, setLocked] = useState(false)
	const [sawPending, setSawPending] = useState(false)

	const othersPending = revokeOthers.state !== "idle"
	const result = revokeOthers.data
	const busy = locked || othersPending
	const othersError = result === baseline ? null : (result?.error ?? null)
	const ordered = sessions.toSorted(byCurrentThenNewest)
	const hasOthers = ordered.some((item) => !item.current)
	const answered =
		locked &&
		!othersPending &&
		(sawPending || (result !== baseline && result?.intent === "revoke-others"))

	if (locked && othersPending && !sawPending) {
		setSawPending(true)
	}

	if (answered) {
		setLocked(false)
		setSawPending(false)
		if (result?.intent === "revoke-others" && !result.error) {
			setConfirming(false)
		}
	}

	function closeConfirm() {
		if (busy) return
		setConfirming(false)
		setLocked(false)
		setSawPending(false)
	}

	function revokeOtherSessions() {
		setBaseline(revokeOthers.data)
		setSawPending(false)
		setLocked(true)
		void revokeOthers.submit(
			{ intent: "revoke-others" },
			{ action: SETTINGS_ACTION, method: "post" }
		)
	}

	return (
		<section className="rounded-box border border-base-300 bg-base-100 p-5">
			<h2 className="font-semibold">Active sessions</h2>
			<p className="mt-1 max-w-2xl text-sm text-base-content/70">
				Manage devices currently signed in to your Keynest account.
			</p>

			{ordered.length === 0 ? (
				<p className="mt-4 text-sm text-base-content/60">No active sessions.</p>
			) : (
				<ul className="list mt-4 overflow-hidden rounded-box border border-base-300">
					{ordered.map((item) => {
						const pending =
							revoke.state !== "idle" && revoke.formData?.get("id") === item.id
						const detail = sessionDetail(item)
						const Icon = deviceIcon(item.userAgent ?? "")

						return (
							<li className="list-row items-center" key={item.id}>
								<Icon
									aria-hidden="true"
									className="size-5 shrink-0 text-base-content/70"
								/>
								<div className="min-w-0">
									<p className="truncate font-medium">
										{sessionTitle(item.userAgent)}
									</p>
									<p className={detail.className}>{detail.text}</p>
								</div>
								{item.current ? (
									<Badge className="badge-soft" size="sm" variant="success">
										Active
									</Badge>
								) : (
									<revoke.Form action={SETTINGS_ACTION} method="post">
										<input name="intent" type="hidden" value="revoke" />
										<input name="id" type="hidden" value={item.id} />
										<Button
											disabled={pending}
											size="sm"
											type="submit"
											variant="ghost"
										>
											{pending ? "Signing out..." : "Sign out"}
										</Button>
									</revoke.Form>
								)}
							</li>
						)
					})}
				</ul>
			)}

			{revoke.data?.error ? (
				<p className="mt-3 text-sm text-error" role="alert">
					{revoke.data.error}
				</p>
			) : null}

			<Button
				className="mt-4 btn-block btn-error"
				disabled={!hasOthers || confirming}
				onClick={() => {
					setBaseline(revokeOthers.data)
					setConfirming(true)
				}}
				type="button"
				variant="outline"
			>
				Revoke all other sessions
			</Button>
			<p className="mt-2 text-xs text-base-content/60">
				Your current session will remain active
			</p>

			<ConfirmDialog
				labelledBy={titleId}
				onClose={closeConfirm}
				open={confirming}
				pending={busy}
			>
				<div className="space-y-4">
					<DialogTitle className="flex items-center gap-2" id={titleId}>
						<ShieldAlert aria-hidden="true" className="size-5 text-error" />
						Revoke all other sessions?
					</DialogTitle>
					<p className="text-sm text-base-content/70">
						This signs you out of Keynest on every other device. Your current
						session stays active, and this device keeps access to your vault.
					</p>
					{othersError ? (
						<p className="text-sm text-error" role="alert">
							{othersError}
						</p>
					) : null}
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							className="flex-1"
							disabled={busy}
							onClick={closeConfirm}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							disabled={busy}
							onClick={revokeOtherSessions}
							type="button"
							variant="destructive"
						>
							{busy ? (
								<span className="loading loading-sm loading-spinner" />
							) : null}
							{busy ? "Revoking..." : "Revoke sessions"}
						</Button>
					</div>
				</div>
			</ConfirmDialog>
		</section>
	)
}

function byCurrentThenNewest(a: SessionInfo, b: SessionInfo) {
	if (a.current !== b.current) return a.current ? -1 : 1
	return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

function sessionDetail(item: SessionInfo) {
	if (item.current) {
		return { className: "text-sm text-success", text: "Current session" }
	}

	let text = signedInLabel(item.createdAt)
	if (item.ipAddress) text = `${text} · ${item.ipAddress}`
	return { className: "text-sm text-base-content/60", text }
}

function sessionTitle(userAgent: string | null) {
	if (!userAgent) return "Unknown device"
	const device = deviceName(userAgent)
	const browser = browserName(userAgent)
	if (!browser) return device
	return `${device} · ${browser}`
}

function browserName(userAgent: string) {
	if (/Edg\/|EdgiOS/.test(userAgent)) return "Edge"
	if (/OPR\/|Opera/.test(userAgent)) return "Opera"
	if (/Firefox\/|FxiOS/.test(userAgent)) return "Firefox"
	if (/Chrome\/|CriOS/.test(userAgent)) return "Chrome"
	if (/Safari\//.test(userAgent)) return "Safari"
	return null
}

function deviceName(userAgent: string) {
	if (/iPhone/.test(userAgent)) return "iPhone"
	if (/iPad/.test(userAgent)) return "iPad"
	if (/Android/.test(userAgent)) {
		if (/Mobile/.test(userAgent)) return "Android"
		return "Android tablet"
	}
	if (/Macintosh|Mac OS X/.test(userAgent)) return "Mac"
	if (/Windows/.test(userAgent)) return "Windows"
	if (/CrOS/.test(userAgent)) return "Chromebook"
	if (/Linux/.test(userAgent)) return "Linux"
	return "Unknown device"
}

function deviceIcon(userAgent = ""): LucideIcon {
	if (/iPad/.test(userAgent)) return Tablet
	if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) return Tablet
	if (/iPhone|Android/.test(userAgent)) return Smartphone
	if (/Windows|Linux/.test(userAgent)) return Monitor
	return Laptop
}

function signedInLabel(iso: string) {
	const elapsed = Date.now() - new Date(iso).getTime()
	if (Number.isNaN(elapsed) || elapsed < MINUTE) return "Signed in just now"
	if (elapsed < HOUR) return `Signed in ${units(elapsed, MINUTE, "minute")} ago`
	if (elapsed < DAY) return `Signed in ${units(elapsed, HOUR, "hour")} ago`
	if (elapsed < 2 * DAY) return "Signed in yesterday"
	return `Signed in ${units(elapsed, DAY, "day")} ago`
}

function units(elapsed: number, size: number, label: string) {
	const value = Math.max(1, Math.floor(elapsed / size))
	if (value === 1) return `1 ${label}`
	return `${value} ${label}s`
}
