import { EmailSchema, PasswordSchema, VaultExportSchema } from "@keynest/shared"
import {
	accountVerifier,
	buildVaultExport,
	changePasswordSecrets,
	downloadVaultExport,
	message
} from "@keynest/utils"
import { useForm } from "@tanstack/react-form"
import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import * as v from "valibot"

import { Button } from "@/components/ui/button"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import { client } from "@/lib/client"
import { importVaultItems, listVaultItems } from "@/lib/vault-api"
import { useAppDispatch, useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"
import {
	changePasswordAsync,
	deleteAccountAsync,
	fetchMeAsync
} from "@/store/auth/extra-reducers"

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

function ChangePassword() {
	const dispatch = useAppDispatch()
	const user = useAppSelector(selectUser)
	const [error, setError] = useState<string | null>(null)
	const [saved, setSaved] = useState(false)

	const form = useForm({
		defaultValues: {
			confirmPassword: "",
			currentPassword: "",
			newPassword: ""
		},
		onSubmit: async ({ value }) => {
			if (!user) return
			setError(null)
			setSaved(false)
			if (value.newPassword !== value.confirmPassword) {
				setError("Passwords do not match.")
				return
			}

			try {
				const input = await changePasswordSecrets(
					value.currentPassword,
					value.newPassword,
					user
				)
				await dispatch(changePasswordAsync(input)).unwrap()
				form.reset()
				setSaved(true)
			} catch (cause) {
				setError(typeof cause === "string" ? cause : message(cause))
			}
		},
		validators: {
			onSubmit: PasswordChangeFormSchema
		}
	})

	return (
		<form
			className="mt-4 max-w-sm space-y-3"
			onSubmit={(event) => {
				event.preventDefault()
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

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button
						disabled={!user || isSubmitting}
						type="submit"
						variant="outline"
					>
						{isSubmitting ? "Updating..." : "Change password"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	)
}

function ImportVault() {
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	return (
		<div className="mt-4 space-y-3">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{notice ? <p className="text-sm text-success">{notice}</p> : null}
			<Input
				accept="application/json"
				className="file-input px-0"
				disabled={pending}
				onChange={(event) => {
					const file = event.target.files?.[0]
					event.target.value = ""
					if (!file) return
					setPending(true)
					setError(null)
					setNotice(null)
					void file
						.text()
						.then(async (raw) => {
							const parsed = v.parse(VaultExportSchema, JSON.parse(raw))
							const result = await importVaultItems(parsed.items)
							setNotice(
								`Imported ${result.imported}. Skipped ${result.skipped} already stored.`
							)
						})
						.catch((cause: unknown) => setError(message(cause)))
						.finally(() => setPending(false))
				}}
				type="file"
			/>
		</div>
	)
}

function ChangeEmail() {
	const user = useAppSelector(selectUser)
	const [error, setError] = useState<string | null>(null)
	const [saved, setSaved] = useState(false)
	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			if (!user) return
			setError(null)
			setSaved(false)
			try {
				const verifier = await accountVerifier(value.password, user)
				const response = await client.users.email.$post({
					json: { email: value.email, verifier }
				})
				if (!response.ok) throw new Error(await response.text())
				form.reset()
				setSaved(true)
			} catch (cause) {
				setError(typeof cause === "string" ? cause : message(cause))
			}
		},
		validators: {
			onSubmit: v.object({ email: EmailSchema, password: PasswordSchema })
		}
	})

	return (
		<form
			className="mt-4 max-w-sm space-y-3"
			onSubmit={(event) => {
				event.preventDefault()
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
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button
						disabled={!user || isSubmitting}
						type="submit"
						variant="outline"
					>
						{isSubmitting ? "Sending..." : "Change email"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	)
}

function TwoFactor() {
	const dispatch = useAppDispatch()
	const user = useAppSelector(selectUser)
	const [secret, setSecret] = useState<string | null>(null)
	const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
	const [code, setCode] = useState("")
	const [password, setPassword] = useState("")
	const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

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
						setPending(true)
						setError(null)
						void accountVerifier(password, user)
							.then(async (verifier) => {
								const response = await client.auth.totp.disable.$post({
									json: { code, verifier }
								})
								if (!response.ok) throw new Error(await response.text())
								setCode("")
								setPassword("")
								await dispatch(fetchMeAsync())
							})
							.catch((cause: unknown) => setError(message(cause)))
							.finally(() => setPending(false))
					}}
				>
					<Fieldset className="p-0">
						<Legend>Password</Legend>
						<Input
							autoComplete="current-password"
							onChange={(event) => setPassword(event.target.value)}
							required
							type="password"
							value={password}
						/>
					</Fieldset>
					<Fieldset className="p-0">
						<Legend>Authentication code</Legend>
						<Input
							onChange={(event) => setCode(event.target.value)}
							required
							value={code}
						/>
					</Fieldset>
					<Button disabled={pending} type="submit" variant="outline">
						{pending ? "Turning off..." : "Turn off authenticator"}
					</Button>
				</form>
			) : secret ? (
				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault()
						setPending(true)
						setError(null)
						void client.auth.totp.confirm
							.$post({ json: { code } })
							.then(async (response) => {
								if (!response.ok) throw new Error(await response.text())
								const body = await response.json()
								await dispatch(fetchMeAsync())
								setSecret(null)
								setRecoveryCodes(body.recoveryCodes)
							})
							.catch((cause: unknown) => setError(message(cause)))
							.finally(() => setPending(false))
					}}
				>
					<p className="font-mono text-sm wrap-break-word">{secret}</p>
					{otpauthUrl ? (
						<p className="text-xs break-all text-base-content/60">
							{otpauthUrl}
						</p>
					) : null}
					<Fieldset className="p-0">
						<Legend>Code from the app</Legend>
						<Input
							onChange={(event) => setCode(event.target.value)}
							required
							value={code}
						/>
					</Fieldset>
					<Button disabled={pending} type="submit" variant="outline">
						{pending ? "Checking..." : "Enable authenticator"}
					</Button>
				</form>
			) : (
				<Button
					disabled={pending}
					onClick={() => {
						setPending(true)
						setError(null)
						void client.auth.totp.setup
							.$post()
							.then(async (response) => {
								if (!response.ok) throw new Error(await response.text())
								const body = await response.json()
								setSecret(body.secret)
								setOtpauthUrl(body.otpauthUrl)
							})
							.catch((cause: unknown) => setError(message(cause)))
							.finally(() => setPending(false))
					}}
					type="button"
					variant="outline"
				>
					{pending ? "Preparing..." : "Set up authenticator"}
				</Button>
			)}
		</div>
	)
}

function ExportVault() {
	const user = useAppSelector(selectUser)
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	return (
		<div className="mt-4">
			{error ? <p className="mb-3 text-sm text-error">{error}</p> : null}
			<Button
				disabled={!user || pending}
				onClick={() => {
					if (!user) return
					setPending(true)
					setError(null)
					void listVaultItems()
						.then((items) => downloadVaultExport(buildVaultExport(user, items)))
						.catch((cause: unknown) => setError(message(cause)))
						.finally(() => setPending(false))
				}}
				type="button"
				variant="outline"
			>
				{pending ? "Preparing..." : "Download encrypted export"}
			</Button>
		</div>
	)
}

function DeleteAccount() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const user = useAppSelector(selectUser)
	const [confirming, setConfirming] = useState(false)
	const confirmingRef = useRef(false)
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			if (!user) return
			if (!confirmingRef.current) {
				confirmingRef.current = true
				setConfirming(true)
				return
			}
			setError(null)
			setPending(true)
			try {
				const verifier = await accountVerifier(value.password, user)
				await dispatch(deleteAccountAsync({ verifier })).unwrap()
				await navigate("/login", { replace: true })
			} catch (cause) {
				setError(typeof cause === "string" ? cause : message(cause))
				setPending(false)
			}
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
						<Button disabled={pending} type="submit" variant="destructive">
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

export default function VaultSecurity() {
	return (
		<div className="space-y-4">
			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Password</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					Changing your password rewraps the vault key and signs out every other
					session. Saved items stay encrypted.
				</p>
				<ChangePassword />
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

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Import</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					Upload an encrypted export from this account. Items stay ciphertext. A
					password change does not require a new export.
				</p>
				<ImportVault />
			</section>

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Export</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					The file contains ciphertext and the wrapped vault key. It still
					requires your password to read.
				</p>
				<ExportVault />
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
