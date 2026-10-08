import type { VaultItemType } from "@keynest/shared"
import { Plus } from "lucide-react"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import { ListItem, ListRow } from "@/components/dashboard/list-item"
import {
	useVault,
	type VaultItemView
} from "@/components/dashboard/vault-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function VaultBrowser({
	addLabel,
	addType,
	description,
	emptyBody,
	predicate,
	title
}: Readonly<{
	addLabel: string
	addType: VaultItemType
	description: string
	emptyBody: string
	predicate: (item: VaultItemView) => boolean
	title: string
}>) {
	const vault = useVault()
	const items = vault.items.filter(predicate)

	return (
		<DashboardWrapper
			actions={
				<Button
					disabled={vault.status !== "unlocked"}
					onClick={() => vault.openComposer(addType)}
					type="button"
				>
					<Plus />
					{addLabel}
				</Button>
			}
			description={description}
			title={title}
		>
			{vault.notice ? (
				<Alert variant="warning">
					<AlertTitle>Vault data was reset</AlertTitle>
					<AlertDescription>{vault.notice}</AlertDescription>
				</Alert>
			) : null}

			{vault.status === "loading" ? (
				<span className="loading loading-spinner text-primary" />
			) : null}

			{vault.status === "locked" ? (
				<div className="rounded-box border border-base-300 bg-base-200 p-5">
					<h2 className="font-semibold">Vault locked</h2>
					<p className="mt-1 text-sm text-base-content/70">
						This tab no longer has the session key
						{vault.sessionCount
							? `, so ${vault.sessionCount} saved ${vault.sessionCount === 1 ? "item is" : "items are"} unreadable`
							: ""}
						. Starting again removes those encrypted items from this tab.
					</p>
					<Button
						className="mt-4"
						onClick={() => void vault.startSession()}
						type="button"
					>
						Start a new session
					</Button>
				</div>
			) : null}

			{vault.status === "unlocked" && items.length === 0 ? (
				<div className="rounded-box border border-base-300 bg-base-200 p-5">
					<h2 className="font-semibold">No items yet</h2>
					<p className="mt-1 max-w-lg text-sm text-base-content/70">
						{emptyBody}
					</p>
					<Button
						className="mt-4"
						onClick={() => vault.openComposer(addType)}
						type="button"
					>
						<Plus />
						{addLabel}
					</Button>
				</div>
			) : null}

			{vault.status === "unlocked" && items.length > 0 ? (
				<ListItem>
					{items.map((item) => (
						<ListRow item={item} key={item.id} onRemove={vault.removeItem} />
					))}
				</ListItem>
			) : null}
		</DashboardWrapper>
	)
}
