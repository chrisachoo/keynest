import { EmailSchema, PasswordSchema } from "@keynest/shared"
import {
	installMasterKey,
	lockVault,
	message,
	recoverSecrets,
	wipe
} from "@keynest/utils"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import * as v from "valibot"

import AuthFormField from "@/components/auth/auth-form-field"
import AuthFormWrapper from "@/components/auth/auth-form-wrapper"
import { Button } from "@/components/ui/button"
import { authCopy } from "@/constants"
import { fetchPrelogin } from "@/lib/auth-api"
import { useAppDispatch } from "@/store"
import { logoutAsync, recoverAsync } from "@/store/auth/extra-reducers"

const RecoverFormSchema = v.object({
	email: EmailSchema,
	password: PasswordSchema,
	phrase: v.pipe(v.string(), v.minLength(1, "Enter your recovery code."))
})

export function Component() {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const copy = authCopy.recover
	const [showPassword, setShowPassword] = useState(false)
	const [serverError, setServerError] = useState<string | null>(null)

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			phrase: ""
		},
		onSubmit: async ({ value }) => {
			setServerError(null)

			try {
				const prelogin = await fetchPrelogin(value.email)
				const recovered = await recoverSecrets(
					value.phrase,
					value.password,
					prelogin
				)
				let signedIn = false

				try {
					const session = await dispatch(
						recoverAsync({ email: value.email, ...recovered.request })
					).unwrap()
					signedIn = true
					const key = await installMasterKey(recovered.masterKey, session)
					if (!key) throw new Error("Could not unlock the vault.")
					await navigate("/dashboard", { replace: true })
				} catch (error) {
					wipe(recovered.masterKey)
					lockVault()
					if (signedIn) await dispatch(logoutAsync())
					setServerError(
						signedIn
							? "Could not unlock the vault."
							: typeof error === "string"
								? error
								: message(error)
					)
				}
			} catch (error) {
				setServerError(message(error))
			}
		},
		validators: {
			onSubmit: RecoverFormSchema
		}
	})

	return (
		<AuthFormWrapper authCopyKey="recover" serverError={serverError}>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					void form.handleSubmit()
				}}
			>
				<form.Field name="email">
					{(field) => (
						<AuthFormField
							autoComplete="email"
							field={field}
							icon={Mail}
							label="Email"
							placeholder="you@example.com"
							type="email"
						/>
					)}
				</form.Field>
				<form.Field name="phrase">
					{(field) => (
						<AuthFormField
							autoComplete="off"
							field={field}
							icon={LockKeyhole}
							label="Recovery code"
							placeholder="word word word"
							type="text"
						/>
					)}
				</form.Field>
				<form.Field name="password">
					{(field) => (
						<AuthFormField
							autoComplete={copy.passwordAutoComplete}
							field={field}
							icon={LockKeyhole}
							label="New password"
							placeholder="At least 12 characters"
							trailing={
								<button
									aria-label={showPassword ? "Hide password" : "Show password"}
									aria-pressed={showPassword}
									className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
									onClick={() => setShowPassword((visible) => !visible)}
									type="button"
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							}
							type={showPassword ? "text" : "password"}
						/>
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
							{isSubmitting ? copy.pending : copy.submit}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</AuthFormWrapper>
	)
}
