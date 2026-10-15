import { LoginFormSchema } from "@keynest/shared"
import { loginSecrets, message, wipe } from "@keynest/utils"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"

import AuthFormField from "@/components/auth/auth-form-field"
import AuthFormWrapper from "@/components/auth/auth-form-wrapper"
import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { authCopy } from "@/constants"
import { fetchPrelogin } from "@/lib/auth-api"
import { client } from "@/lib/client"
import { installMasterKey, lockVault } from "@/lib/vault-session"
import { useAppDispatch } from "@/store"
import {
	confirmTotpAsync,
	loginAsync,
	logoutAsync
} from "@/store/auth/extra-reducers"

export function Component() {
	const navigate = useNavigate()
	const copy = authCopy["login"]
	const dispatch = useAppDispatch()

	const [showPassword, setShowPassword] = useState(false)
	const [serverError, setServerError] = useState<string | null>(null)
	const [ticket, setTicket] = useState<string | null>(null)
	const [code, setCode] = useState("")
	const [confirming, setConfirming] = useState(false)
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
			onSubmit: LoginFormSchema
		}
	})

	async function submitCode(event: FormEvent) {
		event.preventDefault()
		const masterKey = pendingKey.current
		if (!ticket || !masterKey) return
		setServerError(null)
		setConfirming(true)
		let signedIn = false
		try {
			const session = await dispatch(
				confirmTotpAsync({ code, ticket })
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
			setServerError(signedIn ? "Could not unlock the vault." : text)
		} finally {
			setConfirming(false)
		}
	}

	if (ticket) {
		return (
			<AuthFormWrapper authCopyKey="login" serverError={serverError}>
				<form
					className="space-y-4"
					onSubmit={(event) => void submitCode(event)}
				>
					<Fieldset className="p-0">
						<Legend>Authentication code</Legend>
						<Input
							autoComplete="one-time-code"
							inputMode="text"
							onChange={(event) => setCode(event.target.value)}
							placeholder="123456 or recovery code"
							required
							value={code}
						/>
					</Fieldset>
					<Button className="w-full" disabled={confirming} type="submit">
						{confirming ? "Checking..." : "Continue"}
					</Button>
				</form>
			</AuthFormWrapper>
		)
	}

	return (
		<AuthFormWrapper authCopyKey="login" serverError={serverError}>
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

				{serverError?.includes("Confirm your email") ? (
					<Button
						className="h-auto px-0 text-xs"
						onClick={() => {
							const email = form.getFieldValue("email")
							void client.auth.verification.$post({ json: { email } })
							setServerError(
								"If an account is waiting, a new link is on its way."
							)
						}}
						size="sm"
						type="button"
						variant="link"
					>
						Resend confirmation
					</Button>
				) : null}

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
