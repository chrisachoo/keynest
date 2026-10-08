import { getInitials } from "@keynest/shared"
import { Check, Copy, Eye, EyeOff, Trash, X } from "lucide-react"
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode
} from "react"

import type {
	OpenVaultItem,
	VaultItemView
} from "@/components/dashboard/vault-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { cn } from "@/lib/cn"

const CLIPBOARD_TIMEOUT = 15_000
const DRAWER_HIDE_TIMEOUT = 300

const TYPE_NAMES = {
	login: "Login",
	secure_note: "Note"
} as const

const SECRET_LABELS = {
	login: "password",
	secure_note: "note"
} as const

const FIELD_LABELS = {
	login: "Password",
	secure_note: "Note"
} as const

type VaultListContextValue = {
	activeId: string | null
	close: () => void
	copiedId: string | null
	copySecret: (id: string, secret: string) => Promise<void>
	openItem: (item: VaultItemView) => void
	removeItem: (id: string) => void
}

const VaultListContext = createContext<VaultListContextValue | null>(null)

function useVaultList() {
	const value = use(VaultListContext)
	if (!value) throw new Error("List rows must be used inside ListItem")
	return value
}

function formatUpdated(value: string) {
	const elapsed = Date.now() - new Date(value).getTime()
	const minutes = Math.round(elapsed / 60_000)
	if (minutes < 1) return "Just now"
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.round(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	return `${Math.round(hours / 24)}d ago`
}

function isOpenItem(item: VaultItemView): item is OpenVaultItem {
	return item.status === "open"
}

function accountLabel(item: OpenVaultItem) {
	if (item.type === "login") return item.username
	return "Secure note"
}

function rowInitials(item: VaultItemView) {
	if (!isOpenItem(item)) return "!"
	return getInitials(item.name) || "?"
}

function rowTitle(item: VaultItemView) {
	if (!isOpenItem(item)) return "Authentication failed"
	return item.name
}

function rowMeta(item: VaultItemView) {
	const updated = formatUpdated(item.updatedAt)
	if (!isOpenItem(item)) return updated
	return `${accountLabel(item)} · ${updated}`
}

function revealLabel(revealed: boolean, label: string | null) {
	if (revealed) return "Close details"
	if (label) return `Reveal ${label}`
	return "View item"
}

function useSecretClipboard() {
	const [copiedId, setCopiedId] = useState<string | null>(null)
	const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(
		() => () => {
			if (copyTimer.current === null) return
			clearTimeout(copyTimer.current)
			navigator.clipboard.writeText("").catch(() => undefined)
		},
		[]
	)

	const copySecret = useCallback(async (id: string, secret: string) => {
		try {
			await navigator.clipboard.writeText(secret)
		} catch {
			setCopiedId(null)
			return
		}

		setCopiedId(id)
		if (copyTimer.current !== null) clearTimeout(copyTimer.current)
		copyTimer.current = globalThis.setTimeout(() => {
			setCopiedId(null)
			navigator.clipboard.writeText("").catch(() => undefined)
		}, CLIPBOARD_TIMEOUT)
	}, [])

	return { copiedId, copySecret }
}

function ListItem({
	children,
	onRemove
}: Readonly<{
	children: ReactNode
	onRemove: (id: string) => void
}>) {
	const { copiedId, copySecret } = useSecretClipboard()
	const [open, setOpen] = useState(false)
	const [selected, setSelected] = useState<VaultItemView | null>(null)
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(
		() => () => {
			if (hideTimer.current === null) return
			clearTimeout(hideTimer.current)
		},
		[]
	)

	const clearHideTimer = useCallback(() => {
		if (hideTimer.current === null) return
		clearTimeout(hideTimer.current)
		hideTimer.current = null
	}, [])

	const close = useCallback(() => {
		setOpen(false)
		clearHideTimer()
		hideTimer.current = globalThis.setTimeout(() => {
			setSelected(null)
		}, DRAWER_HIDE_TIMEOUT)
	}, [clearHideTimer])

	const openItem = useCallback(
		(item: VaultItemView) => {
			clearHideTimer()
			if (open && selected?.id === item.id) {
				close()
				return
			}

			setSelected(item)
			setOpen(true)
		},
		[clearHideTimer, close, open, selected]
	)

	const removeItem = useCallback(
		(id: string) => {
			onRemove(id)
			close()
		},
		[close, onRemove]
	)

	const activeId = open && selected ? selected.id : null
	const listActions = useMemo(
		() => ({ activeId, close, copiedId, copySecret, openItem, removeItem }),
		[activeId, close, copiedId, copySecret, openItem, removeItem]
	)

	return (
		<VaultListContext value={listActions}>
			<Drawer
				onOpenChange={(next) => {
					if (!next) close()
				}}
				open={open}
				placement="end"
			>
				<DrawerContent>
					<ul className="list rounded-box border border-base-300 bg-base-100">
						{children}
					</ul>
				</DrawerContent>
				<DrawerSide className="z-50" closeLabel="Close details">
					<div className="flex h-full min-h-dvh w-80 max-w-[90vw] flex-col border-s border-base-300 bg-base-100 text-base-content sm:w-96">
						{selected ? <ItemDrawer item={selected} key={selected.id} /> : null}
					</div>
				</DrawerSide>
			</Drawer>
		</VaultListContext>
	)
}

function RowBadge({ item }: Readonly<{ item: VaultItemView }>) {
	if (!isOpenItem(item)) {
		return (
			<Badge size="sm" variant="destructive">
				Blocked
			</Badge>
		)
	}

	return (
		<Badge size="sm" variant="ghost">
			{TYPE_NAMES[item.type]}
		</Badge>
	)
}

function RowCopyButton({ item }: Readonly<{ item: OpenVaultItem }>) {
	const { copiedId, copySecret } = useVaultList()
	const copied = copiedId === item.id
	const label = SECRET_LABELS[item.type]

	return (
		<Button
			aria-label={copied ? "Copied" : `Copy ${label}`}
			onClick={(event) => {
				event.stopPropagation()
				void copySecret(item.id, item.secret)
			}}
			shape="square"
			type="button"
			variant="ghost"
		>
			{copied ? <Check /> : <Copy />}
		</Button>
	)
}

function RevealButton({
	item,
	revealed
}: Readonly<{
	item: VaultItemView
	revealed: boolean
}>) {
	const { openItem } = useVaultList()
	const label = isOpenItem(item) ? SECRET_LABELS[item.type] : null

	return (
		<Button
			aria-expanded={revealed}
			aria-label={revealLabel(revealed, label)}
			onClick={() => openItem(item)}
			shape="square"
			type="button"
			variant="ghost"
		>
			{revealed ? <EyeOff /> : <Eye />}
		</Button>
	)
}

function ListRow({ item }: Readonly<{ item: VaultItemView }>) {
	const { activeId, openItem } = useVaultList()
	const revealed = activeId === item.id

	return (
		<li
			className={cn(
				"list-row cursor-pointer items-center transition-colors hover:bg-base-200",
				revealed && "bg-base-200"
			)}
			onClick={() => openItem(item)}
		>
			<button
				className="flex min-w-0 cursor-pointer items-center gap-3 bg-transparent p-0 text-left font-[inherit] text-inherit list-col-grow"
				onClick={() => openItem(item)}
				type="button"
			>
				<Avatar size="md">{rowInitials(item)}</Avatar>
				<span className="min-w-0">
					<span className="block truncate font-normal capitalize">
						{rowTitle(item)}
					</span>
					<span className="block truncate text-xs font-semibold uppercase opacity-60">
						{rowMeta(item)}
					</span>
				</span>
			</button>
			<RowBadge item={item} />
			{isOpenItem(item) ? <RowCopyButton item={item} /> : null}
			<RevealButton item={item} revealed={revealed} />
		</li>
	)
}

function ItemDrawerHeader({
	initials,
	meta,
	onClose,
	title
}: Readonly<{
	initials: string
	meta: string
	onClose: () => void
	title: string
}>) {
	return (
		<div className="flex items-start justify-between gap-3">
			<div className="flex min-w-0 items-center gap-3">
				<Avatar size="md">{initials}</Avatar>
				<div className="min-w-0">
					<h2 className="truncate text-lg font-semibold capitalize">{title}</h2>
					<p className="truncate text-xs font-semibold uppercase opacity-60">
						{meta}
					</p>
				</div>
			</div>
			<Button
				aria-label="Close"
				onClick={onClose}
				shape="square"
				size="sm"
				type="button"
				variant="ghost"
			>
				<X />
			</Button>
		</div>
	)
}

function OpenItemFields({ item }: Readonly<{ item: OpenVaultItem }>) {
	return (
		<div className="space-y-4">
			{item.type === "login" ? (
				<div>
					<h3 className="text-xs font-semibold uppercase opacity-60">
						Username
					</h3>
					<p className="mt-1 text-sm break-all">{item.username}</p>
				</div>
			) : null}
			<div>
				<h3 className="text-xs font-semibold uppercase opacity-60">
					{FIELD_LABELS[item.type]}
				</h3>
				<p className="mt-2 rounded-box bg-base-200 p-3 font-mono text-sm break-all whitespace-pre-wrap">
					{item.secret}
				</p>
			</div>
		</div>
	)
}

function CopySecretButton({
	copied,
	label,
	onCopy
}: Readonly<{
	copied: boolean
	label: string
	onCopy: () => void
}>) {
	const caption = copied ? "Copied" : `Copy ${label}`

	return (
		<Button className="w-full" onClick={onCopy} type="button" variant="outline">
			{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
			{caption}
		</Button>
	)
}

function DeleteChoice({
	confirming,
	onAsk,
	onKeep,
	onRemove
}: Readonly<{
	confirming: boolean
	onAsk: () => void
	onKeep: () => void
	onRemove: () => void
}>) {
	if (!confirming) {
		return (
			<Button
				className="w-full"
				onClick={onAsk}
				type="button"
				variant="destructive"
			>
				<Trash className="size-4" />
				Delete
			</Button>
		)
	}

	return (
		<div className="space-y-2">
			<p className="text-sm text-base-content/70">Delete this item?</p>
			<div className="flex gap-2">
				<Button
					className="flex-1"
					onClick={onKeep}
					type="button"
					variant="ghost"
				>
					Keep
				</Button>
				<Button
					className="flex-1"
					onClick={onRemove}
					type="button"
					variant="destructive"
				>
					Delete
				</Button>
			</div>
		</div>
	)
}

function OpenItemDrawer({ item }: Readonly<{ item: OpenVaultItem }>) {
	const { close, copiedId, copySecret, removeItem } = useVaultList()
	const [confirming, setConfirming] = useState(false)
	const label = SECRET_LABELS[item.type]

	return (
		<div className="flex h-full flex-1 flex-col gap-6 p-5">
			<ItemDrawerHeader
				initials={getInitials(item.name) || "?"}
				meta={`${accountLabel(item)} · ${formatUpdated(item.updatedAt)}`}
				onClose={close}
				title={item.name}
			/>
			<Badge size="sm" variant="outline">
				{TYPE_NAMES[item.type]}
			</Badge>
			<OpenItemFields item={item} />
			<div className="mt-auto flex flex-col gap-2">
				<CopySecretButton
					copied={copiedId === item.id}
					label={label}
					onCopy={() => void copySecret(item.id, item.secret)}
				/>
				<DeleteChoice
					confirming={confirming}
					onAsk={() => setConfirming(true)}
					onKeep={() => setConfirming(false)}
					onRemove={() => removeItem(item.id)}
				/>
			</div>
		</div>
	)
}

function BlockedItemDrawer({ item }: Readonly<{ item: VaultItemView }>) {
	const { close, removeItem } = useVaultList()

	return (
		<div className="flex h-full flex-1 flex-col gap-6 p-5">
			<ItemDrawerHeader
				initials="!"
				meta={formatUpdated(item.updatedAt)}
				onClose={close}
				title="Authentication failed"
			/>
			<Badge size="sm" variant="destructive">
				Blocked
			</Badge>
			<Alert variant="destructive">
				<AlertTitle>This item failed authentication</AlertTitle>
				<AlertDescription>
					The encrypted record no longer matches its type, nonce, or payload.
					Its secret stays hidden.
				</AlertDescription>
			</Alert>
			<div className="mt-auto">
				<Button
					className="w-full"
					onClick={() => removeItem(item.id)}
					type="button"
					variant="destructive"
				>
					Remove
				</Button>
			</div>
		</div>
	)
}

function ItemDrawer({ item }: Readonly<{ item: VaultItemView }>) {
	if (!isOpenItem(item)) return <BlockedItemDrawer item={item} />
	return <OpenItemDrawer item={item} />
}

export { ListItem, ListRow }
