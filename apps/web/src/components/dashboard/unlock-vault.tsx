import { UnlockInputSchema } from "@keynest/shared"
import { useForm } from "@tanstack/react-form"
import { useFetcher } from "react-router"

import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { DASHBOARD_ACTION, type VaultActionData } from "@/hooks/use-vault"

export default function UnlockVault() {
	const fetcher = useFetcher<VaultActionData>()
	const pending = fetcher.state !== "idle"
	const actionError =
		fetcher.state === "idle" && fetcher.data?.intent === "unlock"
			? fetcher.data.error
			: null

	const form = useForm({
		defaultValues: {
			password: ""
		},
		onSubmit: async ({ value }) => {
			await fetcher.submit(
				{ intent: "unlock", password: value.password },
				{ action: DASHBOARD_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: UnlockInputSchema
		}
	})

	return (
		<form
			className="mt-4 max-w-sm space-y-3"
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<form.Field name="password">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>Password</Legend>
						<Input
							autoComplete="current-password"
							disabled={pending}
							name={field.name}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						{field.state.meta.errors.flatMap((error) => {
							const message = error?.message
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
			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}
			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
					password: state.values.password
				})}
			>
				{({ canSubmit, isSubmitting, password }) => {
					const busy = pending || isSubmitting
					return (
						<Button
							disabled={!canSubmit || busy || !password}
							type="submit"
							variant="primary"
						>
							{busy ? "Unlocking..." : "Unlock vault"}
						</Button>
					)
				}}
			</form.Subscribe>
		</form>
	)
}
