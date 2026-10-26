import { SignupFormSchema } from "@keynest/shared"
import {
	createAccountSecrets,
	installMasterKey,
	lockVault,
	message,
	wipe
} from "@keynest/utils"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff, LockKeyhole, Mail, User } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

import AuthFormField from "@/components/auth/auth-form-field"
import AuthFormWrapper from "@/components/auth/auth-form-wrapper"
import RecoveryKit from "@/components/auth/recovery-kit"
import { Button } from "@/components/ui/button"
import { authCopy } from "@/constants"
import { useAppDispatch } from "@/store"
import { signupAsync } from "@/store/auth/extra-reducers"

export function Component() {
	const navigate = useNavigate()
	const copy = authCopy["signup"]
	const dispatch = useAppDispatch()

	const [showPassword, setShowPassword] = useState(false)
	const [serverError, setServerError] = useState<string | null>(null)
	const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null)
	const [awaitingEmail, setAwaitingEmail] = useState(false)

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: ""
		},
		onSubmit: async ({ value }) => {
			setServerError(null)

			try {
				const created = await createAccountSecrets(value.password)
				try {
					const session = await dispatch(
						signupAsync({
							email: value.email,
							name: value.name,
							...created.secrets
						})
					).unwrap()
					if (!("sessionExpiresAt" in session)) {
						wipe(created.masterKey)
						lockVault()
						setAwaitingEmail(true)
						setRecoveryPhrase(created.recoveryPhrase)
						return
					}
					try {
						const key = await installMasterKey(created.masterKey, session)
						if (!key) lockVault()
					} catch {
						lockVault()
					}
					setRecoveryPhrase(created.recoveryPhrase)
				} catch (error) {
					wipe(created.masterKey)
					lockVault()
					setServerError(typeof error === "string" ? error : message(error))
				}
			} catch (error) {
				setServerError(message(error))
			}
		},
		validators: {
			onSubmit: SignupFormSchema
		}
	})

	if (recoveryPhrase) {
		return (
			<RecoveryKit
				note={
					awaitingEmail
						? "If this email is new, save the code and open the confirmation link before signing in. If you already have an account, ignore the code and sign in."
						: undefined
				}
				onContinue={() =>
					navigate(awaitingEmail ? "/login" : "/dashboard", { replace: true })
				}
				phrase={recoveryPhrase}
			/>
		)
	}

	return (
		<AuthFormWrapper authCopyKey="signup" serverError={serverError}>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					form.handleSubmit()
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<AuthFormField
							field={field}
							icon={User}
							label="Name"
							type="text"
							autoComplete="name"
							placeholder="Your name"
						/>
					)}
				</form.Field>

				<form.Field name="email">
					{(field) => (
						<AuthFormField
							field={field}
							icon={Mail}
							label="Email"
							type="email"
							autoComplete="email"
							placeholder="you@example.com"
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<AuthFormField
							field={field}
							icon={LockKeyhole}
							label="Password"
							type={showPassword ? "text" : "password"}
							autoComplete={copy.passwordAutoComplete}
							placeholder="At least 12 characters"
							trailing={
								<button
									type="button"
									aria-label={showPassword ? "Hide password" : "Show password"}
									aria-pressed={showPassword}
									onClick={() => setShowPassword((visible) => !visible)}
									className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							}
						/>
					)}
				</form.Field>

				{copy.showForgotPassword && (
					<div className="flex justify-end">
						<Button
							type="button"
							variant="link"
							size="sm"
							className="h-auto px-0 text-xs"
						>
							Forgot password?
						</Button>
					</div>
				)}

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? copy.pending : copy.submit}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</AuthFormWrapper>
	)
}
