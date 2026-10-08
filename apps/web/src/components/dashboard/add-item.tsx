import { VAULT_ITEM_TYPES, type VaultItemType } from "@keynest/shared"
import { type PasswordMode } from "@keynest/utils"
import { Shuffle } from "lucide-react"
import { useState, type FormEvent } from "react"

import { useDialog } from "@/components/dashboard/use-dialog"
import type { VaultDraft } from "@/components/dashboard/vault-session"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { usePasswordGenerator } from "@/hooks/use-password-generator"
import { cn } from "@/lib/cn"

const itemTypeLabels = {
	login: "Login",
	secure_note: "Secure note"
} as const satisfies Record<VaultItemType, string>

const loginModes = [
	{ id: "random", label: "Password" },
	{ id: "memorable", label: "Memorable" }
] as const satisfies ReadonlyArray<{ id: PasswordMode; label: string }>

export default function AddItemDialog({
	defaultType,
	onClose,
	onSubmit,
	open
}: Readonly<{
	defaultType: VaultItemType
	onClose: () => void
	onSubmit: (draft: VaultDraft) => Promise<void>
	open: boolean
}>) {
	const dialogRef = useDialog(open)

	return (
		<Dialog onClose={onClose} ref={dialogRef}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto">
				{open ? (
					<AddItemForm
						defaultType={defaultType}
						onClose={onClose}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
			<form className="modal-backdrop" method="dialog">
				<button type="submit">close</button>
			</form>
		</Dialog>
	)
}

function AddItemForm({
	defaultType,
	onClose,
	onSubmit
}: Readonly<{
	defaultType: VaultItemType
	onClose: () => void
	onSubmit: (draft: VaultDraft) => Promise<void>
}>) {
	const generator = usePasswordGenerator()
	const [error, setError] = useState<string | null>(null)
	const [name, setName] = useState("")
	const [note, setNote] = useState("")
	const [saving, setSaving] = useState(false)
	const [type, setType] = useState<VaultItemType>(defaultType)
	const [username, setUsername] = useState("")
	const missing =
		!name.trim() ||
		(type === "login" ? !username.trim() || !generator.password : !note.trim())

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setSaving(true)
		setError(null)

		try {
			await onSubmit({
				name,
				secret: type === "login" ? generator.password : note,
				type,
				username
			})
			onClose()
		} catch {
			setError("Enter a name and a secret before saving.")
		} finally {
			setSaving(false)
		}
	}

	return (
		<form autoComplete="off" className="space-y-3" onSubmit={handleSubmit}>
			<div>
				<h2 className="text-lg font-semibold">Add item</h2>
			</div>

			<div className="tabs tabs-box w-full" role="tablist">
				{VAULT_ITEM_TYPES.map((itemType) => (
					<button
						aria-selected={type === itemType}
						className={cn("tab flex-1", type === itemType && "tab-active")}
						key={itemType}
						onClick={() => setType(itemType)}
						role="tab"
						type="button"
					>
						{itemTypeLabels[itemType]}
					</button>
				))}
			</div>

			<Fieldset className="p-0">
				<Legend>Name</Legend>
				<Input
					autoComplete="off"
					maxLength={120}
					name="keynest-item-name"
					onChange={(event) => setName(event.target.value)}
					placeholder={type === "login" ? "GitHub" : "Recovery codes"}
					required
					value={name}
				/>
			</Fieldset>

			<ItemFields
				generator={generator}
				note={note}
				onNote={setNote}
				onUsername={setUsername}
				type={type}
				username={username}
			/>

			{error ? <p className="text-sm text-error">{error}</p> : null}

			<div className="modal-action">
				<Button onClick={onClose} type="button" variant="ghost">
					Cancel
				</Button>
				<Button disabled={saving || missing} type="submit" variant="primary">
					{saving ? "Saving..." : "Save item"}
				</Button>
			</div>
		</form>
	)
}

function ItemFields({
	generator,
	note,
	onNote,
	onUsername,
	type,
	username
}: Readonly<{
	generator: ReturnType<typeof usePasswordGenerator>
	note: string
	onNote: (value: string) => void
	onUsername: (value: string) => void
	type: VaultItemType
	username: string
}>) {
	switch (type) {
		case "login":
			return (
				<LoginFields
					generator={generator}
					onUsername={onUsername}
					username={username}
				/>
			)
		case "secure_note":
			return <NoteFields note={note} onNote={onNote} />
		default: {
			const unreachable: never = type
			return unreachable
		}
	}
}

function LoginFields({
	generator,
	onUsername,
	username
}: Readonly<{
	generator: ReturnType<typeof usePasswordGenerator>
	onUsername: (value: string) => void
	username: string
}>) {
	return (
		<>
			<Fieldset className="p-0">
				<Legend>Username or email</Legend>
				<Input
					autoCapitalize="off"
					autoComplete="off"
					autoCorrect="off"
					maxLength={320}
					name="keynest-item-username"
					onChange={(event) => onUsername(event.target.value)}
					placeholder="you@example.com"
					required
					spellCheck={false}
					value={username}
				/>
			</Fieldset>

			<div className="join w-full">
				{loginModes.map((mode) => (
					<input
						aria-label={mode.label}
						checked={generator.mode === mode.id}
						className="btn join-item flex-1"
						key={mode.id}
						name="login-secret-mode"
						onChange={() => generator.selectMode(mode.id)}
						type="radio"
						value={mode.id}
					/>
				))}
			</div>

			<div className="flex items-center gap-2 rounded-field bg-base-200 px-3 py-2">
				<p className="min-w-0 flex-1 truncate font-mono text-sm">
					{generator.password || generator.message}
				</p>
				<Button
					aria-label="Generate again"
					className="size-7 min-h-7"
					onClick={generator.regeneratePassword}
					shape="square"
					size="xs"
					type="button"
					variant="ghost"
				>
					<Shuffle className="size-3.5" />
				</Button>
			</div>
		</>
	)
}

function NoteFields({
	note,
	onNote
}: Readonly<{
	note: string
	onNote: (value: string) => void
}>) {
	return (
		<Fieldset className="p-0">
			<Legend>Note</Legend>
			<textarea
				autoComplete="off"
				className="textarea w-full"
				maxLength={8000}
				name="keynest-item-note"
				onChange={(event) => onNote(event.target.value)}
				placeholder="Private note"
				required
				rows={3}
				value={note}
			/>
		</Fieldset>
	)
}
