import {
	disconnected,
	vaultItemList,
	type VaultItemList
} from "@keynest/shared"
import { Archive, LockKeyhole, Plus, Search, Sparkles } from "lucide-react"
import { useState } from "react"
import * as v from "valibot"

import { ActionCard } from "@/components/dashboard/action-card"
import PageHeading from "@/components/dashboard/page-heading"
import Container from "@/components/ui/container"
import { InputGroup } from "@/components/ui/input"
import { vaultCopy } from "@/constants"
import { client } from "@/lib/client"

const actionItems = [
	{
		description: "Create something strong",
		handleOnClick: () => {},
		icon: Sparkles,
		id: "generate-password",
		title: "Generate password"
	},
	{
		description: "Bring your passwords in",
		handleOnClick: () => {},
		icon: Archive,
		id: "import-vault",
		title: "Import vault"
	},
	{
		description: "Secure your workspace",
		handleOnClick: () => {},
		icon: LockKeyhole,
		id: "lock-vault",
		title: "Lock vault"
	}
]

export const loader = async (): Promise<VaultItemList> => {
	try {
		const response = await client["vault-items"].$get({
			query: { type: "login" }
		})

		if (!response.ok) return disconnected(vaultItemList, "API is unreachable")

		return v.parse(vaultItemList, await response.json())
	} catch {
		return disconnected(vaultItemList, "API is unreachable")
	}
}

export function Component() {
	const [query, setQuery] = useState("")

	return (
		<div className="drawer drawer-end">
			<input id="item-drawer" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content">
				<Container className="space-y-6">
					<PageHeading
						description={vaultCopy["all"].description}
						eyebrow={vaultCopy["all"].eyebrow}
						title={vaultCopy["all"].title}
					>
						<label
							htmlFor="item-drawer"
							className="btn drawer-button btn-primary"
						>
							<Plus />
							Add item
						</label>
					</PageHeading>

					<div className="grid gap-4 sm:grid-cols-3">
						{actionItems.map(
							({ description, handleOnClick, icon: Icon, title, id }) => (
								<ActionCard
									key={id}
									description={description}
									onClick={handleOnClick}
									icon={Icon}
									title={title}
								/>
							)
						)}
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-sm font-semibold">
							{vaultCopy["all"].section}
						</h2>
						<InputGroup className="sm:w-64">
							<Search className="size-4 opacity-50" />
							<input
								aria-label="Filter items"
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Filter items..."
								value={query}
							/>
						</InputGroup>
					</div>
				</Container>
			</div>

			<div className="drawer-side z-40">
				<label
					htmlFor="item-drawer"
					aria-label="close sidebar"
					className="drawer-overlay"
				></label>
				<div className="min-h-full w-80 bg-base-200 p-4">
					Sidebar content here
				</div>
			</div>
		</div>
	)
}
