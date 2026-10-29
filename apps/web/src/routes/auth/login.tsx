import { LoginFormSchema } from "@keynest/shared"
import {
	installMasterKey,
	lockVault,
	loginSecrets,
	message,
	wipe
} from "@keynest/utils"
import { useForm } from "@tanstack/react-form"
import { CircleCheck, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import * as v from "valibot"

import AuthFormField from "@/components/auth/auth-form-field"
import AuthFormWrapper from "@/components/auth/auth-form-wrapper"
import GoogleStepForm from "@/components/auth/google-step-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { authCopy } from "@/constants"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { fetchPrelogin } from "@/lib/auth-api"
import { useAppDispatch } from "@/store"
import {
	confirmTotpAsync,
	loginAsync,
	logoutAsync
} from "@/store/auth/extra-reducers"

export function Component() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const copy = authCopy["login"]
	const dispatch = useAppDispatch()
	const google = useGoogleAuth()
	const emailVerified = searchParams.get("verified") === "1"

	const [showPassword, setShowPassword] = useState(false)
	const [serverError, setServerError] = useState<string | null>(null)
	const [ticket, setTicket] = useState<string | null>(null)
	const pendingKey = useRef<Uint8Array | null>(null)

	async function finishLogin(
		masterKey: Uint8Array,
		session: Parameters<typeof installMasterKey>[1]
	) {
		const key = await installMasterKey(masterKey, session)
		if (!key) throw new Error("Could not unlock the vault.")
		await navigate("/dashboard", { replace: true })
	}

	const form = useForm({
		defaultValues: {
			email: "",
			password: ""
		},
		onSubmit: async ({ value }) => {
			setServerError(null)

			try {
				const prelogin = await fetchPrelogin(value.email)
				const secrets = await loginSecrets(value.password, prelogin)
				let signedIn = false

				try {
					const session = await dispatch(
						loginAsync({ email: value.email, verifier: secrets.verifier })
					).unwrap()
					if ("totpRequired" in session) {
						pendingKey.current = secrets.masterKey
						setTicket(session.ticket)
						return
					}
					signedIn = true
					await finishLogin(secrets.masterKey, session)
				} catch (error) {
					wipe(secrets.masterKey)
					lockVault()
					if (signedIn) await dispatch(logoutAsync())
					let loginError = message(error)
					if (signedIn) loginError = "Could not unlock the vault."
					else if (typeof error === "string") loginError = error
					setServerError(loginError)
				}
			} catch (error) {
				setServerError(message(error))
			}
		},
		validators: {
			onSubmit: LoginFormSchema
		}
	})

	const totpForm = useForm({
		defaultValues: {
			code: ""
		},
		onSubmit: async ({ value }) => {
			const masterKey = pendingKey.current

			if (!ticket || !masterKey) return

			setServerError(null)
			let signedIn = false

			try {
				const session = await dispatch(
					confirmTotpAsync({ code: value.code, ticket })
				).unwrap()

				signedIn = true
				pendingKey.current = null

				await finishLogin(masterKey, session)
			} catch (error) {
				const text = typeof error === "string" ? error : message(error)
				if (!signedIn && text === "Incorrect authentication code") {
					setServerError(text)
					return
				}

				wipe(masterKey)
				pendingKey.current = null
				lockVault()

				if (signedIn) await dispatch(logoutAsync())

				setTicket(null)
				let totpError = text

				if (signedIn) totpError = "Could not unlock the vault."
				setServerError(totpError)
			}
		},
		validators: {
			onSubmit: v.object({
				code: v.pipe(v.string(), v.trim(), v.minLength(6), v.maxLength(44))
			})
		}
	})

	if (ticket) {
		return (
			<AuthFormWrapper authCopyKey="login" serverError={serverError}>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault()
						event.stopPropagation()
						void totpForm.handleSubmit()
					}}
				>
					<totpForm.Field name="code">
						{(field) => (
							<Fieldset className="p-0">
								<Legend>Authentication code</Legend>
								<Input
									autoComplete="one-time-code"
									inputMode="text"
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="123456 or recovery code"
									required
									value={field.state.value}
								/>
							</Fieldset>
						)}
					</totpForm.Field>

					<totpForm.Subscribe
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
								{isSubmitting ? "Checking..." : "Continue"}
							</Button>
						)}
					</totpForm.Subscribe>
				</form>
			</AuthFormWrapper>
		)
	}

	if (google.step)
		return (
			<GoogleStepForm
				authCopyKey="login"
				flow={google}
				key={google.step.kind}
				step={google.step}
			/>
		)

	return (
		<AuthFormWrapper
			authCopyKey="login"
			onGoogle={google.onGoogle}
			serverError={serverError ?? google.error}
		>
			{emailVerified ? (
				<Alert
					className="mb-2"
					icon={<CircleCheck className="size-5 shrink-0" />}
					variant="success"
				>
					<AlertTitle>Email confirmed</AlertTitle>
					<AlertDescription>
						Sign in with your master password. Your vault stays locked until you
						unlock it here.
					</AlertDescription>
				</Alert>
			) : null}

			<form
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					form.handleSubmit()
				}}
				className="space-y-4"
			>
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
							placeholder="Password"
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
						<Link className="link text-xs link-primary" to="/recover">
							Forgot password?
						</Link>
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
