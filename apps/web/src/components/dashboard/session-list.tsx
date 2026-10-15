import type { SessionInfo } from "@keynest/shared"
import { message } from "@keynest/utils"
import { Suspense, use, useState } from "react"

import { Button } from "@/components/ui/button"
import { client } from "@/lib/client"

async function loadSessions() {
	const response = await client.sessions.$get()
	if (!response.ok) throw new Error(await response.text())

	const body = await response.json()

	return body.sessions
}

function SessionRows({
	promise
}: Readonly<{ promise: Promise<SessionInfo[]> }>) {
	const initial = use(promise)
	const [sessions, setSessions] = useState(initial)
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="font-semibold">Other devices</h2>
				<Button
					disabled={pending}
					onClick={() => {
						setPending(true)
						setError(null)
						void client.sessions["revoke-others"]
							.$post()
							.then(async (response) => {
								if (!response.ok) throw new Error(await response.text())
								setSessions((current) => current.filter((item) => item.current))
							})
							.catch((cause: unknown) => setError(message(cause)))
							.finally(() => setPending(false))
					}}
					type="button"
					variant="outline"
				>
					Sign out other sessions
				</Button>
			</div>

			<p className="mt-2 max-w-2xl text-sm text-base-content/70">
				Password changes, recovery, and turning off two-factor authentication
				also sign out the other sessions.
			</p>

			{error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

			<ul className="mt-4 space-y-3">
				{sessions.map((item) => (
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
								onClick={() => {
									void client.sessions[":id"]
										.$delete({ param: { id: item.id } })
										.then(async (response) => {
											if (!response.ok) throw new Error(await response.text())
											setSessions((current) =>
												current.filter((session) => session.id !== item.id)
											)
										})
										.catch((cause: unknown) => setError(message(cause)))
								}}
								type="button"
								variant="ghost"
							>
								Sign out
							</Button>
						)}
					</li>
				))}
			</ul>
		</>
	)
}

function SessionSkeletonLoader() {
	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="h-10 w-full max-w-3xl skeleton"></div>
				<div className="h-10 w-30 skeleton"></div>
			</div>

			<div className="h-6 w-full skeleton"></div>
			<div className="h-3 w-full max-w-3xl skeleton"></div>
			<div className="h-4 w-full max-w-3xs skeleton"></div>
		</div>
	)
}

export default function SessionList() {
	const [promise] = useState(loadSessions)

	return (
		<section className="rounded-box border border-base-300 bg-base-100 p-5">
			<Suspense fallback={<SessionSkeletonLoader />}>
				<SessionRows promise={promise} />
			</Suspense>
		</section>
	)
}
