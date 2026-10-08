import { Search } from "lucide-react"
import { useEffect, useState, type KeyboardEvent } from "react"
import { useNavigate } from "react-router"

import {
	useVault,
	type OpenVaultItem,
	type VaultItemView
} from "@/components/dashboard/vault-context"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useDialog } from "@/hooks/use-dialog"
import { cn } from "@/lib/cn"

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
			<DialogContent className="w-full max-w-lg p-0">
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
			<label className="input w-full rounded-none border-x-0 border-t-0">
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

			<div className="max-h-72 overflow-y-auto p-2" id="vault-search-results">
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
						className="menu w-full p-0"
						role="listbox"
					>
						{results.map((item, index) => (
							<li key={item.id}>
								<button
									aria-selected={index === selected}
									className={cn(index === selected && "menu-active")}
									id={`search-result-${item.id}`}
									onClick={() => choose(item)}
									onMouseEnter={() => setActiveIndex(index)}
									role="option"
									type="button"
								>
									<span className="min-w-0 flex-1 text-left">
										<span className="block truncate">{item.name}</span>
										<span className="block truncate text-xs text-base-content/60">
											{item.type === "login" ? item.username : "Secure note"}
										</span>
									</span>
								</button>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</>
	)
}
