import { message } from "@keynest/utils"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"

import { Button } from "@/components/ui/button"
import { client } from "@/lib/client"
import { lockVault } from "@/lib/vault-session"
import { store } from "@/store"
import { fetchMeAsync } from "@/store/auth/extra-reducers"

export function Component() {
	const [params] = useSearchParams()
	const navigate = useNavigate()
	const token = params.get("token")
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!token) return

		let cancelled = false
		void client.auth["verify-email"]
			.$post({ json: { token } })
			.then(async (response) => {
				if (!response.ok) throw new Error(await response.text())
				lockVault()
				await store.dispatch(fetchMeAsync())
				if (!cancelled) await navigate("/dashboard", { replace: true })
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
					Opening your account. The vault stays locked until you enter your
					password.
				</p>
			)}
		</main>
	)
}
