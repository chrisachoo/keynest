import type { GoogleStep } from "@keynest/shared"
import { useForm } from "@tanstack/react-form"
import { useNavigate } from "react-router"
import * as v from "valibot"

import AuthFormWrapper from "@/components/auth/auth-form-wrapper"
import RecoveryKit from "@/components/auth/recovery-kit"
import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import type { GoogleAuth } from "@/hooks/use-google-auth"

const COPY = {
	pending: {
		cta: "Create vault",
		hint: "Choose a master password. It encrypts your vault and never leaves this device.",
		label: "Master password",
		placeholder: "At least 12 characters"
	},
	password: {
		cta: "Unlock vault",
		hint: "Enter your master password to unlock your vault.",
		label: "Master password",
		placeholder: "Master password"
	},
	totp: {
		cta: "Continue",
		hint: "Enter your authentication code.",
		label: "Authentication code",
		placeholder: "123456 or recovery code"
	}
} as const

type Props = Readonly<{
	authCopyKey: "login" | "signup"
	flow: GoogleAuth
	step: GoogleStep
}>

export default function GoogleStepForm({ authCopyKey, flow, step }: Props) {
	const navigate = useNavigate()
	const form = useForm({
		defaultValues: { value: "" },
		onSubmit: async ({ value }) => flow.submit(value.value),
		validators: {
			onSubmit: v.object({ value: v.pipe(v.string(), v.nonEmpty()) })
		}
	})

	if (step.kind === "recovery") {
		return (
			<RecoveryKit
				onContinue={() => navigate("/dashboard", { replace: true })}
				phrase={step.phrase}
			/>
		)
	}

	const copy = COPY[step.kind]
	const totp = step.kind === "totp"

	return (
		<AuthFormWrapper authCopyKey={authCopyKey} serverError={flow.error}>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					void form.handleSubmit()
				}}
			>
				<p className="text-muted-foreground text-sm">{copy.hint}</p>

				<form.Field name="value">
					{(field) => (
						<Fieldset className="p-0">
							<Legend>{copy.label}</Legend>
							<Input
								autoComplete={
									totp
										? "one-time-code"
										: step.kind === "pending"
											? "new-password"
											: "current-password"
								}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder={copy.placeholder}
								type={totp ? "text" : "password"}
								value={field.state.value}
							/>
						</Fieldset>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							className="w-full"
							disabled={!canSubmit || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "Working..." : copy.cta}
						</Button>
					)}
				</form.Subscribe>

				<Button
					className="w-full"
					onClick={() => flow.cancel()}
					type="button"
					variant="link"
				>
					Cancel
				</Button>
			</form>
		</AuthFormWrapper>
	)
}
