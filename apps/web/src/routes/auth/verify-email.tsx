import { lockVault, message } from "@keynest/utils"
import { CircleCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import type { AuthPanelMode } from "@/components/auth/auth-panel"
import AuthShell from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import { client } from "@/lib/client"

type ConfirmStatus = "confirming" | "done" | "error" | "missing"

function readEmailToken() {
	if (globalThis.location === undefined) return null
	const params = new URLSearchParams(globalThis.location.search)
	const value = params.get("token")
	if (value) {
		globalThis.history.replaceState({}, "", globalThis.location.pathname)
	}
	return value
}

const copy: Record<ConfirmStatus, { detail: string; title: string }> = {
	confirming: {
		detail:
			"This only confirms the address. Your vault stays locked until you sign in.",
		title: "Confirming your email"
	},
	done: {
		detail: "Taking you to sign in.",
		title: "Email confirmed"
	},
	error: {
		detail: "Request a new link from the signup page, then try again.",
		title: "This link didn't work"
	},
	missing: {
		detail: "Open the confirmation link from your email.",
		title: "This link is incomplete"
	}
}

function panelFor(status: ConfirmStatus): AuthPanelMode {
	if (status === "confirming") return "confirming"
	if (status === "done") return "confirmed"
	return "default"
}

export function Component() {
	const navigate = useNavigate()
	const [token] = useState(readEmailToken)
	const [status, setStatus] = useState<ConfirmStatus>(
		token ? "confirming" : "missing"
	)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!token) return

		let cancelled = false
		let timer: ReturnType<typeof globalThis.setTimeout> | undefined
		void client.auth["verify-email"]
			.$post({ json: { token } })
			.then(async (response) => {
				if (!response.ok) throw new Error(await response.text())
				lockVault()
				if (cancelled) return
				setStatus("done")
				timer = globalThis.setTimeout(() => {
					void navigate("/login", {
						replace: true,
						state: { verified: true }
					})
				}, 700)
			})
			.catch((cause: unknown) => {
				if (cancelled) return
				setError(message(cause))
				setStatus("error")
			})

		return () => {
			cancelled = true
			if (timer) globalThis.clearTimeout(timer)
		}
	}, [navigate, token])

	const current = copy[status]
	const detail = status === "error" && error ? error : current.detail

	return (
		<AuthShell panel={panelFor(status)}>
			<div className="mx-auto flex w-full max-w-md flex-col justify-center gap-7">
				<div className="flex justify-center">
					<Logo size="md" to="/" />
				</div>
				<div
					className="flex animate-in flex-col items-center gap-4 text-center duration-300 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
					key={status}
				>
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold tracking-tight">
							{current.title}
						</h1>
						<p className="text-muted-foreground text-sm">{detail}</p>
					</div>
					{status === "confirming" ? (
						<span className="loading loading-md loading-spinner" />
					) : null}
					{status === "done" ? (
						<CircleCheck className="size-8 text-success" />
					) : null}
					{status === "error" || status === "missing" ? (
						<Button
							className="w-full"
							onClick={() => navigate("/login")}
							type="button"
						>
							Back to sign in
						</Button>
					) : null}
				</div>
			</div>
		</AuthShell>
	)
}
