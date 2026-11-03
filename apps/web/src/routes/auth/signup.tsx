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
import { useEffect, useState } from "react"
import { useNavigate, useOutletContext } from "react-router"

import AuthFormField from "@/components/auth/auth-form-field"
import AuthFormWrapper, {
	type AuthStep
} from "@/components/auth/auth-form-wrapper"
import CheckEmail from "@/components/auth/check-email"
import RecoveryKit from "@/components/auth/recovery-kit"
import { Button } from "@/components/ui/button"
import { authCopy } from "@/constants"
import type { AuthOutletContext } from "@/routes/auth/layout"
import { useAppDispatch } from "@/store"
import { signupAsync } from "@/store/auth/extra-reducers"

type SignupStep = "form" | "inbox" | "recovery"

const stepIndicator: Record<SignupStep, AuthStep> = {
	form: "account",
	inbox: "email",
	recovery: "recovery"
}

export function Component() {
	const navigate = useNavigate()
	const { setPanel } = useOutletContext<AuthOutletContext>()
	const copy = authCopy["signup"]
	const dispatch = useAppDispatch()

	const [showPassword, setShowPassword] = useState(false)
	const [serverError, setServerError] = useState<string | null>(null)
	const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null)
	const [awaitingEmail, setAwaitingEmail] = useState(false)
	const [email, setEmail] = useState("")
	const [step, setStep] = useState<SignupStep>("form")

	useEffect(() => {
		if (step === "recovery") setPanel("recovery")
		else if (step === "inbox") setPanel("inbox")
		else setPanel("default")
	}, [setPanel, step])

	useEffect(() => {
		return () => setPanel("default")
	}, [setPanel])

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
					setEmail(value.email)
					if (!("sessionExpiresAt" in session)) {
						wipe(created.masterKey)
						lockVault()
						if (!session.created) {
							setStep("inbox")
							return
						}
						setAwaitingEmail(true)
						setRecoveryPhrase(created.recoveryPhrase)
						setStep("recovery")
						return
					}
					try {
						const key = await installMasterKey(created.masterKey, session)
						if (!key) lockVault()
					} catch {
						lockVault()
					}
					setAwaitingEmail(false)
					setRecoveryPhrase(created.recoveryPhrase)
					setStep("recovery")
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

	const headings: Partial<
		Record<SignupStep, { subtitle: string; title: string }>
	> = {
		inbox: {
			subtitle:
				"If this address can take a new account, we sent a confirmation link. It expires soon.",
			title: "Check your email"
		},
		recovery: {
			subtitle:
				"These words can rewrap your vault if you forget your password. Copy them or download the file. Keynest cannot show them again.",
			title: "Save your recovery code"
		}
	}
	const heading = headings[step]
	const showRecovery = step === "recovery" && Boolean(recoveryPhrase)
	const showInbox = step === "inbox"

	return (
		<AuthFormWrapper
			authCopyKey="signup"
			serverError={step === "form" ? serverError : null}
			showSwitch={step === "form"}
			stageKey={step}
			step={stepIndicator[step]}
			subtitle={heading?.subtitle}
			title={heading?.title}
		>
			{showRecovery && recoveryPhrase ? (
				<RecoveryKit
					heading={false}
					onContinue={() => {
						if (awaitingEmail) {
							setStep("inbox")
							return
						}
						void navigate("/dashboard", { replace: true })
					}}
					phrase={recoveryPhrase}
				/>
			) : null}
			{showInbox ? (
				<CheckEmail
					email={email}
					onChangeEmail={() => setStep("form")}
					onContinue={() =>
						void navigate("/login", { replace: true, state: { email } })
					}
				/>
			) : null}
			{showRecovery || showInbox ? null : (
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
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
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
			)}
		</AuthFormWrapper>
	)
}
