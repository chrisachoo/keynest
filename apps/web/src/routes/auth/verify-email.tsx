import { message } from "@keynest/utils"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { client } from "@/lib/client"
import { lockVault } from "@/lib/vault-session"

function readEmailToken() {
	if (globalThis.location === undefined) return null
	const params = new URLSearchParams(globalThis.location.search)
	const value = params.get("token")
	if (value) {
		globalThis.history.replaceState({}, "", globalThis.location.pathname)
	}
	return value
}

export function Component() {
	const navigate = useNavigate()
	const [token] = useState(readEmailToken)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!token) return

		let cancelled = false
		void client.auth["verify-email"]
			.$post({ json: { token } })
			.then(async (response) => {
				if (!response.ok) throw new Error(await response.text())
				lockVault()
				if (!cancelled) await navigate("/login?verified=1", { replace: true })
			})
			.catch((cause: unknown) => {
				if (!cancelled) setError(message(cause))
			})

		return () => {
			cancelled = true
		}
	}, [navigate, token])

	const notice = token ? error : "This confirmation link is missing a token."

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-5">
			<h1 className="text-3xl font-semibold tracking-tight">
				Confirming email
			</h1>
			{notice ? (
				<>
					<p className="text-sm text-error">{notice}</p>
					<Button onClick={() => navigate("/login")} type="button">
						Back to sign in
					</Button>
				</>
			) : (
				<p className="text-sm text-base-content/70">
					Confirming your email. You will sign in next with your master password
					to unlock the vault.
				</p>
			)}
		</main>
	)
}
