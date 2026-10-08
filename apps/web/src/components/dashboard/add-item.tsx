import {
	AddItemSchema,
	VAULT_ITEM_TYPES,
	type VaultItemType
} from "@keynest/shared"
import { type PasswordMode } from "@keynest/utils"
import { useForm, type AnyFieldApi } from "@tanstack/react-form"
import { Shuffle } from "lucide-react"
import { useEffect, type ReactNode } from "react"
import { useFetcher } from "react-router"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { useDialog } from "@/hooks/use-dialog"
import { usePasswordGenerator } from "@/hooks/use-password-generator"
import { cn } from "@/lib/cn"
import { DASHBOARD_ACTION, type VaultActionData } from "@/lib/vault/vault"

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
	open
}: Readonly<{
	defaultType: VaultItemType
	onClose: () => void
	open: boolean
}>) {
	const dialogRef = useDialog(open)

	return (
		<Dialog onClose={onClose} ref={dialogRef}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto">
				{open ? (
					<AddItemForm defaultType={defaultType} onClose={onClose} />
				) : null}
			</DialogContent>
			<form className="modal-backdrop" method="dialog">
				<button type="submit">close</button>
			</form>
		</Dialog>
	)
}

function FieldError({ field }: Readonly<{ field: AnyFieldApi }>) {
	return field.state.meta.errors.flatMap((error) => {
		const text = error?.message
		if (!text) return []
		return [
			<p className="text-sm text-error" key={text}>
				{text}
			</p>
		]
	})
}

function AddItemForm({
	defaultType,
	onClose
}: Readonly<{
	defaultType: VaultItemType
	onClose: () => void
}>) {
	const generator = usePasswordGenerator()
	const fetcher = useFetcher<VaultActionData>()
	const pending = fetcher.state !== "idle"
	const actionError =
		fetcher.state === "idle" && fetcher.data?.intent === "create"
			? fetcher.data.error
			: null

	useEffect(() => {
		if (fetcher.state !== "idle" || !fetcher.data) return
		if (fetcher.data.intent !== "create" || fetcher.data.error) return
		onClose()
	}, [fetcher.data, fetcher.state, onClose])

	const form = useForm({
		defaultValues: {
			name: "",
			note: "",
			type: defaultType,
			username: ""
		},
		onSubmit: async ({ value }) => {
			const secret = value.type === "login" ? generator.password : value.note
			if (!secret.trim()) return

			await fetcher.submit(
				{
					intent: "create",
					name: value.name,
					secret,
					type: value.type,
					username: value.type === "login" ? value.username : ""
				},
				{ action: DASHBOARD_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: AddItemSchema
		}
	})

	return (
		<form
			autoComplete="off"
			className="space-y-3"
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<div>
				<h2 className="text-lg font-semibold">Add item</h2>
			</div>

			<form.Field name="type">
				{(field) => (
					<div className="tabs tabs-box w-full" role="tablist">
						{VAULT_ITEM_TYPES.map((itemType) => (
							<button
								aria-selected={field.state.value === itemType}
								className={cn(
									"tab flex-1",
									field.state.value === itemType && "tab-active"
								)}
								key={itemType}
								onClick={() => field.handleChange(itemType)}
								role="tab"
								type="button"
							>
								{itemTypeLabels[itemType]}
							</button>
						))}
					</div>
				)}
			</form.Field>

			<form.Subscribe selector={(state) => state.values.type}>
				{(type) => (
					<form.Field name="name">
						{(field) => (
							<Fieldset className="p-0">
								<Legend>Name</Legend>
								<Input
									autoComplete="off"
									maxLength={120}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder={type === "login" ? "GitHub" : "Recovery codes"}
									required
									value={field.state.value}
								/>
								<FieldError field={field} />
							</Fieldset>
						)}
					</form.Field>
				)}
			</form.Subscribe>

			<form.Subscribe selector={(state) => state.values.type}>
				{(type) =>
					type === "login" ? (
						<LoginFields form={form} generator={generator} />
					) : (
						<NoteFields form={form} />
					)
				}
			</form.Subscribe>

			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}

			<div className="modal-action">
				<Button onClick={onClose} type="button" variant="ghost">
					Cancel
				</Button>
				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
						type: state.values.type
					})}
				>
					{({ canSubmit, isSubmitting, type }) => {
						const busy = pending || isSubmitting
						const missingSecret = type === "login" && !generator.password
						return (
							<Button
								disabled={!canSubmit || busy || missingSecret}
								type="submit"
								variant="primary"
							>
								{busy ? "Saving..." : "Save item"}
							</Button>
						)
					}}
				</form.Subscribe>
			</div>
		</form>
	)
}

function LoginFields<
	TForm extends {
		Field: (props: {
			children: (field: AnyFieldApi) => ReactNode
			name: "username"
		}) => ReactNode | Promise<ReactNode>
	}
>({
	form,
	generator
}: Readonly<{
	form: TForm
	generator: ReturnType<typeof usePasswordGenerator>
}>) {
	return (
		<>
			<form.Field name="username">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>Username or email</Legend>
						<Input
							autoCapitalize="off"
							autoComplete="off"
							autoCorrect="off"
							maxLength={320}
							name={field.name}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							placeholder="you@example.com"
							required
							spellCheck={false}
							value={field.state.value}
						/>
						<FieldError field={field} />
					</Fieldset>
				)}
			</form.Field>

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

function NoteFields<
	TForm extends {
		Field: (props: {
			children: (field: AnyFieldApi) => ReactNode
			name: "note"
		}) => ReactNode | Promise<ReactNode>
	}
>({
	form
}: Readonly<{
	form: TForm
}>) {
	return (
		<form.Field name="note">
			{(field) => (
				<Fieldset className="p-0">
					<Legend>Note</Legend>
					<textarea
						autoComplete="off"
						className="textarea w-full"
						maxLength={8000}
						name={field.name}
						onBlur={field.handleBlur}
						onChange={(event) => field.handleChange(event.target.value)}
						placeholder="Private note"
						required
						rows={3}
						value={field.state.value}
					/>
					<FieldError field={field} />
				</Fieldset>
			)}
		</form.Field>
	)
}
