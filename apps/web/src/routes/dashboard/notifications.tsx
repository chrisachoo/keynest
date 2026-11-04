import type { Notification } from "@keynest/shared"
import { errorMessage } from "@keynest/utils"
import { Bell, MailCheck, ShieldAlert, type LucideIcon } from "lucide-react"
import { Suspense } from "react"
import { Await, useLoaderData } from "react-router"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/ui/loader"
import { client } from "@/lib/client"

const KIND_ICONS: Record<Notification["kind"], LucideIcon> = {
	signup: MailCheck,
	signup_existing: ShieldAlert
}

async function fetchNotifications() {
	const response = await client.notifications.$get()
	if (!response.ok) throw new Error(await errorMessage(response))
	return (await response.json()).notifications
}

export function loader() {
	return { notifications: fetchNotifications() }
}

function NotificationList({
	notifications
}: Readonly<{ notifications: Notification[] }>) {
	if (notifications.length === 0) {
		return (
			<div className="rounded-box border border-base-300 bg-base-200 p-5">
				<h2 className="flex items-center gap-2 font-semibold">
					<Bell className="size-4" />
					No notifications
				</h2>
				<p className="mt-1 max-w-lg text-sm text-base-content/70">
					Account updates and security notices will show up here.
				</p>
			</div>
		)
	}

	return (
		<ul className="list rounded-box border border-base-300 bg-base-100">
			{notifications.map((item) => {
				const Icon = KIND_ICONS[item.kind]
				return (
					<li className="list-row items-start" key={item.id}>
						<Icon className="mt-1 size-5 text-primary" />
						<div className="min-w-0">
							<p className="font-medium">{item.title}</p>
							<p className="text-sm text-base-content/70">{item.body}</p>
							<time
								className="text-xs text-base-content/60"
								dateTime={item.createdAt}
							>
								{new Date(item.createdAt).toLocaleString()}
							</time>
						</div>
					</li>
				)
			})}
		</ul>
	)
}

export function Component() {
	const data = useLoaderData() as ReturnType<typeof loader>

	return (
		<DashboardWrapper
			description="Account updates and security notices."
			title="Notifications"
		>
			<Suspense
				fallback={
					<div
						aria-live="polite"
						className="flex items-center gap-2 text-sm text-base-content/70"
					>
						<Loading size="sm" />
						Loading notifications...
					</div>
				}
			>
				<Await
					errorElement={
						<Alert variant="destructive">
							<AlertDescription>Could not load notifications.</AlertDescription>
						</Alert>
					}
					resolve={data.notifications}
				>
					{(notifications) => (
						<NotificationList notifications={notifications} />
					)}
				</Await>
			</Suspense>
		</DashboardWrapper>
	)
}
