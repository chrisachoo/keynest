import { CLIPBOARD_TIMEOUT } from "@keynest/shared"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useClipboard } from "@/hooks/use-clipboard"

export default function RecoveryKit({
	note,
	onContinue,
	phrase
}: Readonly<{
	note?: string
	onContinue: () => void
	phrase: string
}>) {
	const { copied, copy } = useClipboard({
		clear: true,
		timeout: CLIPBOARD_TIMEOUT
	})
	const [saved, setSaved] = useState(false)

	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-6">
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					Save your recovery code
				</h1>
				<p className="text-sm text-base-content/70">
					{note ??
						"This code can rewrap your vault if you forget your password. Keynest cannot show it again."}
				</p>
			</div>
			<p className="rounded-box bg-base-200 p-4 font-mono text-sm wrap-break-word">
				{phrase}
			</p>
			<Button onClick={() => void copy(phrase)} type="button" variant="outline">
				{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
				{copied ? "Copied" : "Copy recovery code"}
			</Button>
			<label className="flex items-start gap-2 text-sm">
				<Checkbox
					checked={saved}
					className="mt-0.5"
					onChange={(event) => setSaved(event.target.checked)}
				/>
				I saved this recovery code somewhere safe.
			</label>
			<Button disabled={!saved} onClick={onContinue} type="button">
				Continue
			</Button>
		</div>
	)
}
