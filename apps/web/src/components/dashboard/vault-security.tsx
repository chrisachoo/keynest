import { EmailSchema, PasswordSchema, TotpCodeSchema } from "@keynest/shared"
import { useForm } from "@tanstack/react-form"
import { useEffect, useRef, useState } from "react"
import { useFetcher } from "react-router"
import * as v from "valibot"

import RecoveryKit from "@/components/auth/recovery-kit"
import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

export const ACCOUNT_ACTION = "/dashboard/account"

export type AccountActionData = {
	error?: string
	intent?:
		| "delete"
		| "email"
		| "password"
		| "recovery"
		| "totp-confirm"
		| "totp-disable"
		| "totp-setup"
	otpauthUrl?: string
	phrase?: string
	recoveryCodes?: string[]
	secret?: string
}

const PasswordChangeFormSchema = v.object({
	confirmPassword: PasswordSchema,
	currentPassword: PasswordSchema,
	newPassword: PasswordSchema
})

function FieldError({
	errors
}: Readonly<{
	errors: ReadonlyArray<{ message?: string } | undefined>
}>) {
	return errors.flatMap((error) => {
		const text = error?.message
		if (!text) return []
		return [
			<p className="text-sm text-error" key={text}>
				{text}
			</p>
		]
	})
}

function actionError(
	fetcher: { data: AccountActionData | undefined; state: string },
	intent: NonNullable<AccountActionData["intent"]>
) {
	if (fetcher.state !== "idle" || fetcher.data?.intent !== intent) return null
	return fetcher.data.error ?? null
}

function actionOk(
	fetcher: { data: AccountActionData | undefined; state: string },
	intent: NonNullable<AccountActionData["intent"]>
) {
	return (
		fetcher.state === "idle" &&
		fetcher.data?.intent === intent &&
		!fetcher.data.error
	)
}

function ChangePassword() {
	const user = useAppSelector(selectUser)
	const fetcher = useFetcher<AccountActionData>()
	const pending = fetcher.state !== "idle"
	const error = actionError(fetcher, "password")
	const saved = actionOk(fetcher, "password")

	const form = useForm({
		defaultValues: {
			confirmPassword: "",
			currentPassword: "",
			newPassword: ""
		},
		onSubmit: async ({ value }) => {
			await fetcher.submit(
				{ ...value, intent: "password" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: PasswordChangeFormSchema
		}
	})

	const savedOnce = useRef(false)
	useEffect(() => {
		if (!saved) {
			savedOnce.current = false
			return
		}
		if (savedOnce.current) return
		savedOnce.current = true
		form.reset()
	}, [form, saved])

	return (
		<form
			className="mt-4 max-w-sm space-y-3"
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<form.Field name="currentPassword">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>Current password</Legend>
						<Input
							autoComplete="current-password"
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>

			<form.Field name="newPassword">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>New password</Legend>
						<Input
							autoComplete="new-password"
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>

			<form.Field name="confirmPassword">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>Confirm password</Legend>
						<Input
							autoComplete="new-password"
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{saved ? <p className="text-sm text-success">Password updated.</p> : null}

			<Button disabled={!user || pending} type="submit" variant="outline">
				{pending ? "Updating..." : "Change password"}
			</Button>
		</form>
	)
}

function ChangeEmail() {
	const user = useAppSelector(selectUser)
	const fetcher = useFetcher<AccountActionData>()
	const pending = fetcher.state !== "idle"
	const error = actionError(fetcher, "email")
	const saved = actionOk(fetcher, "email")

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			await fetcher.submit(
				{ ...value, intent: "email" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: v.object({ email: EmailSchema, password: PasswordSchema })
		}
	})

	const savedOnce = useRef(false)
	useEffect(() => {
		if (!saved) {
			savedOnce.current = false
			return
		}
		if (savedOnce.current) return
		savedOnce.current = true
		form.reset()
	}, [form, saved])

	return (
		<form
			className="mt-4 max-w-sm space-y-3"
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<form.Field name="email">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>New email</Legend>
						<Input
							autoComplete="email"
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="email"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>
			<form.Field name="password">
				{(field) => (
					<Fieldset className="p-0">
						<Legend>Password</Legend>
						<Input
							autoComplete="current-password"
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{saved ? (
				<p className="text-sm text-success">
					If that address is available, a confirmation link was sent.
				</p>
			) : null}
			<Button disabled={!user || pending} type="submit" variant="outline">
				{pending ? "Sending..." : "Change email"}
			</Button>
		</form>
	)
}

function TwoFactor() {
	const user = useAppSelector(selectUser)
	const setup = useFetcher<AccountActionData>()
	const confirm = useFetcher<AccountActionData>()
	const disable = useFetcher<AccountActionData>()
	const setupPending = setup.state !== "idle"
	const confirmPending = confirm.state !== "idle"
	const disablePending = disable.state !== "idle"
	const error =
		actionError(setup, "totp-setup") ??
		actionError(confirm, "totp-confirm") ??
		actionError(disable, "totp-disable")
	const secret =
		setup.data?.intent === "totp-setup" && !setup.data.error
			? setup.data.secret
			: null
	const recoveryCodes =
		confirm.data?.intent === "totp-confirm" && !confirm.data.error
			? confirm.data.recoveryCodes
			: null

	const setupForm = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			await setup.submit(
				{ ...value, intent: "totp-setup" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: v.object({ password: PasswordSchema })
		}
	})

	const confirmForm = useForm({
		defaultValues: { code: "" },
		onSubmit: async ({ value }) => {
			await confirm.submit(
				{ ...value, intent: "totp-confirm" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: TotpCodeSchema
		}
	})

	const disableForm = useForm({
		defaultValues: { code: "", password: "" },
		onSubmit: async ({ value }) => {
			await disable.submit(
				{ ...value, intent: "totp-disable" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: v.object({
				code: v.pipe(v.string(), v.trim(), v.minLength(6), v.maxLength(44)),
				password: PasswordSchema
			})
		}
	})

	if (!user) return null

	return (
		<div className="mt-4 max-w-sm space-y-3">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{recoveryCodes ? (
				<div className="space-y-2">
					<p className="text-sm text-base-content/70">
						Save these recovery codes. Each one works once if you lose the
						authenticator.
					</p>
					<ul className="rounded-box bg-base-200 p-3 font-mono text-sm">
						{recoveryCodes.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			) : null}
			{recoveryCodes ? null : user.totpEnabled ? (
				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault()
						event.stopPropagation()
						void disableForm.handleSubmit()
					}}
				>
					<disableForm.Field name="password">
						{(field) => (
							<Fieldset className="p-0">
								<Legend>Password</Legend>
								<Input
									autoComplete="current-password"
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									required
									type="password"
									value={field.state.value}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Fieldset>
						)}
					</disableForm.Field>
					<disableForm.Field name="code">
						{(field) => (
							<Fieldset className="p-0">
								<Legend>Authentication code</Legend>
								<Input
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									required
									value={field.state.value}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Fieldset>
						)}
					</disableForm.Field>
					<Button disabled={disablePending} type="submit" variant="outline">
						{disablePending ? "Turning off..." : "Turn off authenticator"}
					</Button>
				</form>
			) : secret ? (
				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault()
						event.stopPropagation()
						void confirmForm.handleSubmit()
					}}
				>
					<p className="font-mono text-sm wrap-break-word">{secret}</p>
					{setup.data?.otpauthUrl ? (
						<p className="text-xs break-all text-base-content/60">
							{setup.data.otpauthUrl}
						</p>
					) : null}
					<confirmForm.Field name="code">
						{(field) => (
							<Fieldset className="p-0">
								<Legend>Code from the app</Legend>
								<Input
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									required
									value={field.state.value}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Fieldset>
						)}
					</confirmForm.Field>
					<Button disabled={confirmPending} type="submit" variant="outline">
						{confirmPending ? "Checking..." : "Enable authenticator"}
					</Button>
				</form>
			) : (
				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault()
						event.stopPropagation()
						void setupForm.handleSubmit()
					}}
				>
					<setupForm.Field name="password">
						{(field) => (
							<Fieldset className="p-0">
								<Legend>Password</Legend>
								<Input
									autoComplete="current-password"
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									required
									type="password"
									value={field.state.value}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Fieldset>
						)}
					</setupForm.Field>
					<Button disabled={setupPending} type="submit" variant="outline">
						{setupPending ? "Preparing..." : "Set up authenticator"}
					</Button>
				</form>
			)}
		</div>
	)
}

function DeleteAccount() {
	const user = useAppSelector(selectUser)
	const fetcher = useFetcher<AccountActionData>()
	const pending = fetcher.state !== "idle"
	const [confirming, setConfirming] = useState(false)
	const confirmingRef = useRef(false)
	const error = actionError(fetcher, "delete")

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			if (!confirmingRef.current) {
				confirmingRef.current = true
				setConfirming(true)
				return
			}
			await fetcher.submit(
				{ ...value, intent: "delete" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: v.object({ password: PasswordSchema })
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
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{confirming ? (
				<div className="space-y-2">
					<p className="text-sm text-base-content/70">
						This permanently deletes the account and every encrypted item.
					</p>
					<div className="flex gap-2">
						<Button
							onClick={() => {
								confirmingRef.current = false
								setConfirming(false)
							}}
							type="button"
							variant="ghost"
						>
							Keep account
						</Button>
						<Button
							disabled={!user || pending}
							type="submit"
							variant="destructive"
						>
							{pending ? "Deleting..." : "Delete account"}
						</Button>
					</div>
				</div>
			) : (
				<Button
					onClick={() => {
						confirmingRef.current = true
						setConfirming(true)
					}}
					type="button"
					variant="destructive"
				>
					Delete account
				</Button>
			)}
		</form>
	)
}

function IssueRecovery() {
	const user = useAppSelector(selectUser)
	const fetcher = useFetcher<AccountActionData>()
	const pending = fetcher.state !== "idle"
	const [dismissed, setDismissed] = useState<AccountActionData | undefined>()
	const error = actionError(fetcher, "recovery")
	const phrase =
		actionOk(fetcher, "recovery") && fetcher.data !== dismissed
			? fetcher.data?.phrase
			: null

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			await fetcher.submit(
				{ ...value, intent: "recovery" },
				{ action: ACCOUNT_ACTION, method: "post" }
			)
		},
		validators: {
			onSubmit: v.object({ password: PasswordSchema })
		}
	})

	if (phrase) {
		return (
			<RecoveryKit
				note="Your previous recovery code no longer works. Save this one before you continue. Keynest cannot show it again."
				onContinue={() => {
					setDismissed(fetcher.data)
					form.reset()
				}}
				phrase={phrase}
			/>
		)
	}

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
						<Legend>Current password</Legend>
						<Input
							autoComplete="current-password"
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							required
							type="password"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Fieldset>
				)}
			</form.Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<Button disabled={!user || pending} type="submit">
				{pending ? "Issuing..." : "Issue a new recovery code"}
			</Button>
		</form>
	)
}

export function AccountSecurity() {
	return (
		<div className="space-y-4">
			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Password</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					Changing your password rewraps the vault key and signs out every other
					session. Saved items stay encrypted. The current recovery code still
					opens the vault until you issue a new one.
				</p>
				<ChangePassword />
			</section>

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Recovery code</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					The code from signup keeps working until a new one is saved. If this
					request fails, the existing code is unchanged. After it succeeds, the
					previous code cannot open the vault.
				</p>
				<IssueRecovery />
			</section>

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Email</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					The new address is saved after you open the confirmation link. This
					needs email delivery to be configured.
				</p>
				<ChangeEmail />
			</section>

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Authenticator</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					Add a second code at sign-in. Enter the secret in an authenticator
					app, then confirm with a code.
				</p>
				<TwoFactor />
			</section>

			<section className="rounded-box border border-error/40 bg-base-100 p-5">
				<h2 className="font-semibold">Delete account</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					Enter your password, then confirm. This cannot be undone.
				</p>
				<DeleteAccount />
			</section>
		</div>
	)
}
