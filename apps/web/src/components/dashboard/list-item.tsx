import { getInitials } from "@keynest/shared"
import { Check, Copy, EllipsisVertical, Eye, EyeOff } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import type { VaultItemView } from "@/components/dashboard/vault-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function formatUpdated(value: string) {
	const elapsed = Date.now() - new Date(value).getTime()
	const minutes = Math.round(elapsed / 60_000)
	if (minutes < 1) return "Just now"
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.round(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	return `${Math.round(hours / 24)}d ago`
}

function ListItem({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<ul className="list rounded-box border border-base-300 bg-base-100">
			{children}
		</ul>
	)
}

function ListRow({
	item,
	onRemove
}: Readonly<{
	item: VaultItemView
	onRemove: (id: string) => void
}>) {
	const [confirming, setConfirming] = useState(false)
	const [copied, setCopied] = useState(false)
	const [revealed, setRevealed] = useState(false)
	const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(
		() => () => {
			if (copyTimer.current === null) return
			clearTimeout(copyTimer.current)
			navigator.clipboard.writeText("").catch(() => undefined)
		},
		[]
	)

	async function copySecret(secret: string) {
		try {
			await navigator.clipboard.writeText(secret)
		} catch {
			setCopied(false)
			return
		}

		setCopied(true)
		if (copyTimer.current !== null) clearTimeout(copyTimer.current)
		copyTimer.current = globalThis.setTimeout(() => {
			setCopied(false)
			navigator.clipboard.writeText("").catch(() => undefined)
		}, 15_000)
	}

	if (item.status === "tampered") {
		return (
			<li className="list-row">
				<div>
					<Avatar size="md">!</Avatar>
				</div>
				<div className="min-w-0">
					<Alert variant="destructive">
						<AlertTitle>This item failed authentication</AlertTitle>
						<AlertDescription>
							The encrypted record no longer matches its type, nonce, or
							payload. Its secret stays hidden.
						</AlertDescription>
					</Alert>
				</div>
				<Badge size="sm" variant="destructive">
					Blocked
				</Badge>
				<Button
					onClick={() => onRemove(item.id)}
					size="sm"
					type="button"
					variant="outline"
				>
					Remove
				</Button>
			</li>
		)
	}

	const secretLabel = item.type === "login" ? "password" : "note"

	return (
		<li className="list-row items-center">
			<div>
				<Avatar size="md">{getInitials(item.name) || "?"}</Avatar>
			</div>
			<div className="min-w-0">
				<div className="truncate font-normal capitalize">{item.name}</div>
				<div className="truncate text-xs font-semibold uppercase opacity-60">
					{item.type === "login" ? item.username : "Secure note"} ·{" "}
					{formatUpdated(item.updatedAt)}
				</div>
				{revealed ? (
					<p className="mt-2 font-mono text-sm break-all">{item.secret}</p>
				) : (
					<p className="mt-2 text-xs text-base-content/60">
						{item.type === "login" ? "Password hidden" : "Note hidden"}
					</p>
				)}
			</div>

			<Badge size="sm" variant="ghost">
				{item.type === "login" ? "Login" : "Note"}
			</Badge>
			<Button
				aria-label={revealed ? `Hide ${secretLabel}` : `Show ${secretLabel}`}
				onClick={() => setRevealed((current) => !current)}
				shape="square"
				type="button"
				variant="ghost"
			>
				{revealed ? <EyeOff /> : <Eye />}
			</Button>
			<Button
				aria-label={copied ? "Copied" : `Copy ${secretLabel}`}
				onClick={() => void copySecret(item.secret)}
				shape="square"
				type="button"
				variant="ghost"
			>
				{copied ? <Check /> : <Copy />}
			</Button>
			{confirming ? (
				<div className="flex gap-1">
					<Button
						onClick={() => setConfirming(false)}
						size="xs"
						type="button"
						variant="ghost"
					>
						Keep
					</Button>
					<Button
						onClick={() => onRemove(item.id)}
						size="xs"
						type="button"
						variant="destructive"
					>
						Delete
					</Button>
				</div>
			) : (
				<Button
					aria-label="Delete item"
					onClick={() => setConfirming(true)}
					shape="square"
					type="button"
					variant="ghost"
				>
					<EllipsisVertical />
				</Button>
			)}
		</li>
	)
}

export { ListItem, ListRow }
