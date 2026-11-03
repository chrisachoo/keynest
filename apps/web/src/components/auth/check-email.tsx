import { Mail } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { IconBadge } from "@/components/ui/icon-badge"
import { client } from "@/lib/client"

export default function CheckEmail({
	email,
	onChangeEmail,
	onContinue
}: Readonly<{
	email: string
	onChangeEmail: () => void
	onContinue: () => void
}>) {
	const [pending, setPending] = useState(false)
	const [sent, setSent] = useState(false)

	function resend() {
		if (pending || sent) return
		setPending(true)
		void client.auth.verification
			.$post({ json: { email } })
			.catch(() => undefined)
			.finally(() => {
				setPending(false)
				setSent(true)
			})
	}

	let resendLabel = "Resend email"
	if (sent) resendLabel = "Sent"
	else if (pending) resendLabel = "Sending…"

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-center">
				<IconBadge shape="rounded" size="lg">
					<Mail className="size-6" />
				</IconBadge>
			</div>
			<p className="rounded-box bg-base-200 px-4 py-3 text-center text-sm font-medium break-all">
				{email}
			</p>
			<Button className="w-full" onClick={onContinue} type="button">
				I've confirmed my email
			</Button>
			<Button
				className="w-full"
				disabled={pending || sent}
				onClick={resend}
				type="button"
				variant="ghost"
			>
				{resendLabel}
			</Button>
			<Button
				className="w-full"
				onClick={onChangeEmail}
				type="button"
				variant="link"
			>
				Use a different email
			</Button>
		</div>
	)
}
