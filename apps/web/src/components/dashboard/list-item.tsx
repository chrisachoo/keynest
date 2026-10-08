import {
	CLIPBOARD_TIMEOUT,
	DRAWER_HIDE_TIMEOUT,
	FIELD_LABELS,
	SECRET_LABELS,
	TYPE_NAMES
} from "@keynest/shared"
import { getInitials } from "@keynest/utils"
import { Check, Copy, Eye, EyeOff, Star, Trash, X } from "lucide-react"
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
import { useFetcher } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { cn } from "@/lib/cn"
import {
	DASHBOARD_ACTION,
	type OpenVaultItem,
	type VaultActionData,
	type VaultItemView
} from "@/lib/vault/vault"

type VaultListContextValue = {
	activeId: string | null
	close: () => void
	copiedId: string | null
	copySecret: (id: string, secret: string) => Promise<void>
	openItem: (item: VaultItemView) => void
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
	items
}: Readonly<{
	children: ReactNode
	items: VaultItemView[]
}>) {
	const { copiedId, copySecret } = useSecretClipboard()
	const [open, setOpen] = useState(false)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [snapshot, setSnapshot] = useState<VaultItemView | null>(null)
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const live = selectedId
		? (items.find((item) => item.id === selectedId) ?? null)
		: null
	if (live && live !== snapshot) setSnapshot(live)
	if (!selectedId && snapshot) setSnapshot(null)
	const selected = selectedId ? (live ?? snapshot) : null

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
			setSelectedId(null)
		}, DRAWER_HIDE_TIMEOUT)
	}, [clearHideTimer])

	const openItem = useCallback(
		(item: VaultItemView) => {
			clearHideTimer()
			if (open && selectedId === item.id) {
				close()
				return
			}

			setSelectedId(item.id)
			setOpen(true)
		},
		[clearHideTimer, close, open, selectedId]
	)

	const activeId = open && selectedId ? selectedId : null
	const listActions = useMemo(
		() => ({
			activeId,
			close,
			copiedId,
			copySecret,
			openItem
		}),
		[activeId, close, copiedId, copySecret, openItem]
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

export function RowBadge({ item }: Readonly<{ item: VaultItemView }>) {
	if (!isOpenItem(item)) {
		return (
			<Badge size="sm" variant="destructive">
				Blocked
			</Badge>
		)
	}

	return (
		<Badge size="sm" variant={item.type === "login" ? "light" : "success"}>
			{TYPE_NAMES[item.type]}
		</Badge>
	)
}

function RowFavoriteButton({ item }: Readonly<{ item: OpenVaultItem }>) {
	const fetcher = useFetcher<VaultActionData>({ key: `favorite:${item.id}` })
	const pendingFavorite = fetcher.formData?.get("favorite")
	const favorite =
		typeof pendingFavorite === "string"
			? pendingFavorite === "true"
			: item.favorite
	const label = favorite ? "Remove from favorites" : "Add to favorites"
	const pending = fetcher.state !== "idle"

	return (
		<Button
			aria-label={label}
			aria-pressed={favorite}
			disabled={pending}
			onClick={(event) => {
				event.stopPropagation()
				void fetcher.submit(
					{
						favorite: favorite ? "false" : "true",
						id: item.id,
						intent: "favorite"
					},
					{ action: DASHBOARD_ACTION, method: "post" }
				)
			}}
			shape="square"
			type="button"
			variant="ghost"
		>
			<Star
				className={favorite ? "fill-amber-500 text-amber-500" : undefined}
			/>
		</Button>
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
			{isOpenItem(item) ? <RowFavoriteButton item={item} /> : null}
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

function useDeleteItem(id: string, onDeleted: () => void) {
	const fetcher = useFetcher<VaultActionData>()
	const deleting = fetcher.state !== "idle"

	useEffect(() => {
		if (!deleting && fetcher.data?.intent === "delete" && !fetcher.data.error)
			onDeleted()
	}, [deleting, fetcher.data, onDeleted])

	const remove = useCallback(() => {
		void fetcher.submit(
			{ id, intent: "delete" },
			{ action: DASHBOARD_ACTION, method: "post" }
		)
	}, [fetcher, id])

	return {
		deleting,
		error:
			fetcher.state === "idle" && fetcher.data?.intent === "delete"
				? fetcher.data.error
				: null,
		remove
	}
}

function DeleteChoice({
	confirming,
	deleting,
	onAsk,
	onKeep,
	onRemove
}: Readonly<{
	confirming: boolean
	deleting: boolean
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
					disabled={deleting}
					onClick={onRemove}
					type="button"
					variant="destructive"
				>
					{deleting ? "Deleting..." : "Delete"}
				</Button>
			</div>
		</div>
	)
}

function OpenItemDrawer({ item }: Readonly<{ item: OpenVaultItem }>) {
	const { close, copiedId, copySecret } = useVaultList()
	const [confirming, setConfirming] = useState(false)
	const deletion = useDeleteItem(item.id, close)
	const label = SECRET_LABELS[item.type]

	return (
		<div className="flex h-full flex-1 flex-col gap-6 p-5">
			<ItemDrawerHeader
				initials={getInitials(item.name) || "?"}
				meta={`${accountLabel(item)} · ${formatUpdated(item.updatedAt)}`}
				onClose={close}
				title={item.name}
			/>
			<div className="flex items-center gap-2">
				<Badge size="sm" variant="outline">
					{TYPE_NAMES[item.type]}
				</Badge>
				<RowFavoriteButton item={item} />
			</div>
			<OpenItemFields item={item} />
			<div className="mt-auto flex flex-col gap-2">
				<CopySecretButton
					copied={copiedId === item.id}
					label={label}
					onCopy={() => void copySecret(item.id, item.secret)}
				/>
				{deletion.error ? (
					<p className="text-sm text-error">{deletion.error}</p>
				) : null}
				<DeleteChoice
					confirming={confirming}
					deleting={deletion.deleting}
					onAsk={() => setConfirming(true)}
					onKeep={() => setConfirming(false)}
					onRemove={deletion.remove}
				/>
			</div>
		</div>
	)
}

function BlockedItemDrawer({ item }: Readonly<{ item: VaultItemView }>) {
	const { close } = useVaultList()
	const deletion = useDeleteItem(item.id, close)

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
			<div className="mt-auto space-y-2">
				{deletion.error ? (
					<p className="text-sm text-error">{deletion.error}</p>
				) : null}
				<Button
					className="w-full"
					disabled={deletion.deleting}
					onClick={deletion.remove}
					type="button"
					variant="destructive"
				>
					{deletion.deleting ? "Removing..." : "Remove"}
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
