import type { VaultItemType, VaultItemView } from "@keynest/shared"
import { Plus } from "lucide-react"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import { ListItem, ListRow } from "@/components/dashboard/list-item"
import UnlockVault from "@/components/dashboard/unlock-vault"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useOpenComposer, useVault } from "@/hooks/use-vault"

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
	const openComposer = useOpenComposer()
	const items = vault.items.filter(predicate)
	const unlocked = vault.status === "unlocked"

	return (
		<DashboardWrapper
			actions={
				<Button
					disabled={!unlocked}
					onClick={() => openComposer(addType)}
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
					<AlertTitle>Could not load the vault</AlertTitle>
					<AlertDescription>{vault.notice}</AlertDescription>
				</Alert>
			) : null}

			{vault.status === "locked" ? (
				<div className="rounded-box border border-base-300 bg-base-200 p-5">
					<h2 className="font-semibold">Vault locked</h2>
					<p className="mt-1 max-w-lg text-sm text-base-content/70">
						{vault.notice
							? "The item list could not be loaded."
							: vault.itemCount
								? `${vault.itemCount} encrypted ${vault.itemCount === 1 ? "item is" : "items are"} saved for this account.`
								: "No encrypted items are saved for this account yet."}{" "}
						Enter your password to unlock them in this tab. Locking drops the
						key. The server keeps ciphertext only.
					</p>
					<UnlockVault />
				</div>
			) : null}

			{unlocked && items.length === 0 ? (
				<div className="rounded-box border border-base-300 bg-base-200 p-5">
					<h2 className="font-semibold">No items yet</h2>
					<p className="mt-1 max-w-lg text-sm text-base-content/70">
						{emptyBody}
					</p>
					<Button
						className="mt-4"
						onClick={() => openComposer(addType)}
						type="button"
					>
						<Plus />
						{addLabel}
					</Button>
				</div>
			) : null}

			{unlocked && items.length > 0 ? (
				<ListItem items={items}>
					{items.map((item) => (
						<ListRow item={item} key={item.id} />
					))}
				</ListItem>
			) : null}
		</DashboardWrapper>
	)
}
