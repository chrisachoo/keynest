import { EmailSchema, PasswordSchema, TotpCodeSchema } from "@keynest/shared"
import {
	accountVerifier,
	changePasswordSecrets,
	errorMessage,
	message,
	rotateRecoverySecrets
} from "@keynest/utils"
import { redirect, type ActionFunctionArgs } from "react-router"
import * as v from "valibot"

import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import RoutingTabs from "@/components/dashboard/routing-tabs"
import {
	AccountSecurity,
	type AccountActionData
} from "@/components/dashboard/vault-security"
import { Badge } from "@/components/ui/badge"
import { client } from "@/lib/client"
import { store, useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"
import {
	changePasswordAsync,
	deleteAccountAsync,
	fetchMeAsync
} from "@/store/auth/extra-reducers"

const accountIntents = [
	"delete",
	"email",
	"password",
	"recovery",
	"totp-confirm",
	"totp-disable",
	"totp-setup"
] as const

type AccountIntent = (typeof accountIntents)[number]

function field(formData: FormData, key: string) {
	const value = formData.get(key)
	return typeof value === "string" ? value : ""
}

function isAccountIntent(value: string): value is AccountIntent {
	return accountIntents.some((intent) => intent === value)
}

function failure(cause: unknown, intent?: AccountIntent): AccountActionData {
	return {
		error: typeof cause === "string" ? cause : message(cause),
		intent
	}
}

async function readError(response: { json(): Promise<unknown> }) {
	throw new Error(await errorMessage(response))
}

export async function action({
	request
}: ActionFunctionArgs): Promise<AccountActionData | Response> {
	const formData = await request.formData()
	const rawIntent = field(formData, "intent")
	const intent = isAccountIntent(rawIntent) ? rawIntent : undefined
	const user = selectUser(store.getState())
	if (!user) return { error: "Log in again.", intent }

	try {
		switch (intent) {
			case "password": {
				const parsed = v.safeParse(
					v.object({
						confirmPassword: PasswordSchema,
						currentPassword: PasswordSchema,
						newPassword: PasswordSchema
					}),
					{
						confirmPassword: field(formData, "confirmPassword"),
						currentPassword: field(formData, "currentPassword"),
						newPassword: field(formData, "newPassword")
					}
				)
				if (!parsed.success)
					return failure("Check the password fields.", intent)
				if (parsed.output.newPassword !== parsed.output.confirmPassword)
					return failure("Passwords do not match.", intent)

				const input = await changePasswordSecrets(
					parsed.output.currentPassword,
					parsed.output.newPassword,
					user
				)
				await store.dispatch(changePasswordAsync(input)).unwrap()
				return { intent }
			}
			case "email": {
				const parsed = v.safeParse(
					v.object({
						email: EmailSchema,
						password: PasswordSchema
					}),
					{
						email: field(formData, "email"),
						password: field(formData, "password")
					}
				)
				if (!parsed.success) return failure("Check the email fields.", intent)
				const verifier = await accountVerifier(parsed.output.password, user)
				const response = await client.users.email.$post({
					json: { email: parsed.output.email, verifier }
				})
				if (!response.ok) await readError(response)
				return { intent }
			}
			case "recovery": {
				const parsed = v.safeParse(PasswordSchema, field(formData, "password"))
				if (!parsed.success) return failure("Enter your password.", intent)
				const rotated = await rotateRecoverySecrets(parsed.output, user)
				const response = await client.auth.recovery.$post({
					json: rotated.request
				})
				if (!response.ok) await readError(response)
				return { intent, phrase: rotated.phrase }
			}
			case "totp-setup": {
				const parsed = v.safeParse(PasswordSchema, field(formData, "password"))
				if (!parsed.success) return failure("Enter your password.", intent)
				const verifier = await accountVerifier(parsed.output, user)
				const response = await client.auth.totp.setup.$post({
					json: { verifier }
				})
				if (!response.ok) await readError(response)
				const body = await response.json()
				return {
					intent,
					otpauthUrl: body.otpauthUrl,
					secret: body.secret
				}
			}
			case "totp-confirm": {
				const parsed = v.safeParse(TotpCodeSchema, {
					code: field(formData, "code")
				})
				if (!parsed.success) return failure("Enter the 6-digit code.", intent)
				const response = await client.auth.totp.confirm.$post({
					json: { code: parsed.output.code }
				})
				if (!response.ok) await readError(response)
				const body = await response.json()
				await store.dispatch(fetchMeAsync())
				return { intent, recoveryCodes: body.recoveryCodes }
			}
			case "totp-disable": {
				const parsed = v.safeParse(
					v.object({
						code: v.pipe(v.string(), v.trim(), v.minLength(6), v.maxLength(44)),
						password: PasswordSchema
					}),
					{
						code: field(formData, "code"),
						password: field(formData, "password")
					}
				)
				if (!parsed.success)
					return failure("Check the authenticator fields.", intent)
				const verifier = await accountVerifier(parsed.output.password, user)
				const response = await client.auth.totp.disable.$post({
					json: { code: parsed.output.code, verifier }
				})
				if (!response.ok) await readError(response)
				await store.dispatch(fetchMeAsync())
				return { intent }
			}
			case "delete": {
				const parsed = v.safeParse(PasswordSchema, field(formData, "password"))
				if (!parsed.success) return failure("Enter your password.", intent)
				const verifier = await accountVerifier(parsed.output, user)
				await store.dispatch(deleteAccountAsync({ verifier })).unwrap()
				return redirect("/login")
			}
			default:
				return { error: "Unknown action." }
		}
	} catch (error) {
		if (error instanceof Response) throw error
		return failure(error, intent)
	}
}

export function Component() {
	const user = useAppSelector(selectUser)

	return (
		<DashboardWrapper
			description="Manage your profile and how you sign in."
			title="Account"
		>
			<RoutingTabs />

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 className="font-semibold">Profile</h2>
						<p className="mt-1 text-sm text-base-content/70">
							Your account identity and verification status.
						</p>
					</div>
					<Badge variant={user?.emailVerified ? "success" : "warning"}>
						{user?.emailVerified ? "Email verified" : "Email unverified"}
					</Badge>
				</div>

				<dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
					<div>
						<dt className="text-base-content/60">Name</dt>
						<dd className="mt-1 font-medium">{user?.name}</dd>
					</div>
					<div>
						<dt className="text-base-content/60">Email</dt>
						<dd className="mt-1 font-medium">{user?.email}</dd>
					</div>
				</dl>
			</section>

			<AccountSecurity />
		</DashboardWrapper>
	)
}
