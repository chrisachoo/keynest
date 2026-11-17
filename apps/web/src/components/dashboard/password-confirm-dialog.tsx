import { PasswordSchema } from "@keynest/shared"
import { useForm } from "@tanstack/react-form"
import { useId, type ReactNode } from "react"
import * as v from "valibot"

import ConfirmDialog from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import { DialogTitle } from "@/components/ui/dialog"
import { Fieldset, Input, Legend } from "@/components/ui/input"

type PasswordConfirmDialogProps = {
	confirmLabel: string
	description: string
	disabled?: boolean
	error?: string | null
	icon: ReactNode
	onClose: () => void
	onConfirm: (password: string) => Promise<void>
	open: boolean
	pending: boolean
	pendingLabel: string
	title: string
}

export default function PasswordConfirmDialog({
	onClose,
	open,
	pending,
	...props
}: Readonly<PasswordConfirmDialogProps>) {
	const titleId = useId()

	return (
		<ConfirmDialog
			labelledBy={titleId}
			onClose={onClose}
			open={open}
			pending={pending}
		>
			<PasswordConfirmForm
				onClose={onClose}
				pending={pending}
				titleId={titleId}
				{...props}
			/>
		</ConfirmDialog>
	)
}

function PasswordConfirmForm({
	confirmLabel,
	description,
	disabled,
	error,
	icon,
	onClose,
	onConfirm,
	pending,
	pendingLabel,
	title,
	titleId
}: Readonly<Omit<PasswordConfirmDialogProps, "open"> & { titleId: string }>) {
	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			await onConfirm(value.password)
		},
		validators: {
			onSubmit: v.object({ password: PasswordSchema })
		}
	})

	return (
		<form
			className="flex flex-col items-center gap-4 text-center"
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<div
				aria-hidden="true"
				className="grid size-16 place-items-center rounded-full bg-error/10 text-error [&>svg]:size-8"
			>
				{icon}
			</div>
			<div className="space-y-2">
				<DialogTitle className="text-xl" id={titleId}>
					{title}
				</DialogTitle>
				<p className="text-sm text-base-content/70">{description}</p>
			</div>
			<form.Field name="password">
				{(field) => (
					<Fieldset className="w-full p-0 text-left">
						<Legend>
							<label htmlFor={`${titleId}-password`}>Password</label>
						</Legend>
						<Input
							autoComplete="current-password"
							autoFocus
							disabled={pending}
							id={`${titleId}-password`}
							name={field.name}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
							withInputClass
						/>
						{field.state.meta.errors.flatMap((item) => {
							const message = item?.message
							if (!message) return []
							return [
								<p className="text-sm text-error" key={message}>
									{message}
								</p>
							]
						})}
					</Fieldset>
				)}
			</form.Field>
			{error ? (
				<p className="w-full text-left text-sm text-error" role="alert">
					{error}
				</p>
			) : null}
			<div className="grid w-full grid-cols-2 gap-2">
				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						password: state.values.password
					})}
				>
					{({ canSubmit, password }) => (
						<Button
							disabled={disabled || pending || !canSubmit || !password}
							type="submit"
							variant="destructive"
						>
							{pending ? pendingLabel : confirmLabel}
						</Button>
					)}
				</form.Subscribe>
				<Button
					disabled={pending}
					onClick={onClose}
					type="button"
					variant="light"
				>
					Cancel
				</Button>
			</div>
		</form>
	)
}
