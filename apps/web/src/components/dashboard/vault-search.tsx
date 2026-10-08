import { TYPE_NAMES } from "@keynest/shared"
import { getInitials } from "@keynest/utils"
import { Search, Star } from "lucide-react"
import { useEffect, useState, type KeyboardEvent } from "react"
import { useNavigate } from "react-router"

import { Avatar, getAvatarColor } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useDialog } from "@/hooks/use-dialog"
import {
	useVault,
	type OpenVaultItem,
	type VaultItemView
} from "@/lib/vault/vault"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

function isOpen(item: VaultItemView): item is OpenVaultItem {
	return item.status === "open"
}

function matches(item: OpenVaultItem, query: string) {
	const needle = query.trim().toLowerCase()
	return `${item.name} ${item.username}`.toLowerCase().includes(needle)
}

export default function VaultSearch({
	onClose,
	open
}: Readonly<{
	onClose: () => void
	open: boolean
}>) {
	const dialogRef = useDialog(open)

	return (
		<Dialog
			className="place-items-start! justify-items-center! pt-16 sm:pt-24"
			onClose={onClose}
			ref={dialogRef}
		>
			<DialogContent className="w-full max-w-lg p-2">
				{open ? <SearchPanel onClose={onClose} /> : null}
			</DialogContent>
			<form className="modal-backdrop" method="dialog">
				<button type="submit">close</button>
			</form>
		</Dialog>
	)
}

function SearchPanel({ onClose }: Readonly<{ onClose: () => void }>) {
	const navigate = useNavigate()
	const vault = useVault()
	const [query, setQuery] = useState("")
	const [activeIndex, setActiveIndex] = useState(0)
	const needle = query.trim()
	const results = needle
		? vault.items.filter(isOpen).filter((item) => matches(item, needle))
		: []
	const selected = Math.min(activeIndex, Math.max(results.length - 1, 0))
	const activeId = results[selected]?.id

	useEffect(() => {
		if (!activeId) return
		globalThis.document
			.getElementById(`search-result-${activeId}`)
			?.scrollIntoView({ block: "nearest" })
	}, [activeId])

	function choose(item: OpenVaultItem) {
		onClose()
		navigate(
			item.type === "secure_note"
				? "/dashboard/notes"
				: "/dashboard?view=logins"
		)
	}

	function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown" && results.length > 0) {
			event.preventDefault()
			setActiveIndex((selected + 1) % results.length)
		}
		if (event.key === "ArrowUp" && results.length > 0) {
			event.preventDefault()
			setActiveIndex((selected - 1 + results.length) % results.length)
		}
		if (event.key === "Enter") {
			event.preventDefault()
			const item = results[selected]
			if (item) choose(item)
		}
	}

	return (
		<>
			<label className="input w-full">
				<Search className="size-4 opacity-60" />
				<input
					aria-activedescendant={
						results[selected]
							? `search-result-${results[selected].id}`
							: undefined
					}
					aria-autocomplete="list"
					aria-controls="vault-search-results"
					aria-expanded={results.length > 0}
					aria-label="Search vault"
					autoComplete="off"
					autoFocus
					onChange={(event) => {
						setQuery(event.target.value)
						setActiveIndex(0)
					}}
					onKeyDown={onKeyDown}
					placeholder="Search logins and notes"
					role="combobox"
					value={query}
				/>
			</label>

			<div className="max-h-72 overflow-y-auto pt-2" id="vault-search-results">
				{vault.status === "locked" ? (
					<p className="px-3 py-4 text-sm text-base-content/60">
						Unlock this tab to search items.
					</p>
				) : null}

				{vault.status !== "locked" && !needle ? (
					<p className="px-3 py-4 text-sm text-base-content/60">
						Type a name or username. Use arrow keys and enter.
					</p>
				) : null}

				{vault.status !== "locked" && needle && results.length === 0 ? (
					<p className="px-3 py-4 text-sm text-base-content/60">
						No matching items.
					</p>
				) : null}

				{results.length > 0 ? (
					<ul
						aria-label="Search results"
						className="list w-full p-0"
						role="listbox"
					>
						{results.map((item, index) => (
							<li
								className="list-row cursor-pointer items-center px-1 transition-colors hover:bg-base-200"
								key={item.id}
								onClick={() => choose(item)}
								onMouseEnter={() => setActiveIndex(index)}
							>
								<Avatar className={getAvatarColor(item.name)}>
									{getInitials(item.name)}
								</Avatar>
								<div>
									<span className="block truncate">{item.name}</span>
									<span className="block truncate text-xs font-semibold uppercase opacity-60">
										{item.type === "login" ? item.username : "Secure note"}
									</span>
								</div>

								<Badge
									size="sm"
									variant={item.type === "login" ? "light" : "success"}
								>
									{TYPE_NAMES[item.type]}
								</Badge>
								<Button variant="ghost" shape="circle">
									<Star
										className={
											item.favorite
												? "fill-amber-500 text-amber-500"
												: undefined
										}
									/>
								</Button>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</>
	)
}
