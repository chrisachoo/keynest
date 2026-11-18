import { PasswordSchema } from "@keynest/shared"
import { useForm } from "@tanstack/react-form"
import { Trash2 } from "lucide-react"
import { useEffect, useId } from "react"
import * as v from "valibot"

import ConfirmDialog from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import { DialogTitle } from "@/components/ui/dialog"
import { Fieldset, Input, Legend } from "@/components/ui/input"

type DeleteAccountDialogProps = {
	disabled?: boolean
	error?: string | null
	onClose: () => void
	onConfirm: (password: string) => Promise<void>
	open: boolean
	pending: boolean
}

export default function DeleteAccountDialog({
	disabled,
	error,
	onClose,
	onConfirm,
	open,
	pending
}: Readonly<DeleteAccountDialogProps>) {
	const titleId = useId()
	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => await onConfirm(value.password),
		validators: {
			onSubmit: v.object({ password: PasswordSchema })
		}
	})

	useEffect(() => {
		if (!open) form.reset()
	}, [form, open])

	return (
		<form.Subscribe
			selector={(state) => ({
				canSubmit: state.canSubmit,
				isSubmitting: state.isSubmitting,
				password: state.values.password
			})}
		>
			{({ canSubmit, isSubmitting, password }) => {
				const isPending = pending || isSubmitting

				return (
					<ConfirmDialog
						labelledBy={titleId}
						onClose={onClose}
						open={open}
						pending={isPending}
					>
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
								<Trash2 />
							</div>
							<div className="space-y-2">
								<DialogTitle className="text-xl" id={titleId}>
									Delete your account?
								</DialogTitle>
								<p className="text-sm text-base-content/70">
									Your Keynest account and all encrypted items in your vault
									will be permanently deleted. This includes all saved passwords
									and other stored data. We'll send you an email once the
									deletion is complete.
								</p>
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
											disabled={isPending}
											id={`${titleId}-password`}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
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
								<Button
									disabled={isPending}
									onClick={onClose}
									type="button"
									variant="light"
								>
									Cancel
								</Button>
								<Button
									disabled={disabled || isPending || !canSubmit || !password}
									type="submit"
									variant="destructive"
								>
									{isPending ? "Deleting..." : "Delete account"}
								</Button>
							</div>
						</form>
					</ConfirmDialog>
				)
			}}
		</form.Subscribe>
	)
}
