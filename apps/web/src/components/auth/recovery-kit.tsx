import { CLIPBOARD_TIMEOUT } from "@keynest/shared"
import { Check, Copy, Download, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useClipboard } from "@/hooks/use-clipboard"

type RecoveryEntry = {
	label: string
	word: string
}

function recoveryEntries(phrase: string): RecoveryEntry[] {
	return phrase
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word, position) => ({ label: String(position + 1), word }))
}

function downloadRecoveryCode(phrase: string, words: RecoveryEntry[]) {
	const lines = [
		"Keynest recovery code",
		"",
		"Keynest cannot show this code again. Keep it private.",
		"",
		...words.map((entry) => `${entry.label}. ${entry.word}`),
		"",
		"Enter the words in order, separated by spaces:",
		phrase.trim()
	]
	const url = URL.createObjectURL(
		new Blob([`${lines.join("\n")}\n`], { type: "text/plain" })
	)
	const link = document.createElement("a")
	link.href = url
	link.download = "keynest-recovery-code.txt"
	document.body.appendChild(link)
	link.click()
	link.remove()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function RecoveryKit({
	heading = true,
	note,
	onContinue,
	phrase
}: Readonly<{
	heading?: boolean
	note?: string
	onContinue: () => void
	phrase: string
}>) {
	const { copied, copy } = useClipboard({
		clear: true,
		timeout: CLIPBOARD_TIMEOUT
	})
	const [hidden, setHidden] = useState(false)
	const [saved, setSaved] = useState(false)
	const words = recoveryEntries(phrase)
	const explanation =
		note ??
		"This code can rewrap your vault if you forget your password. Keynest cannot show it again."
	let intro = null
	if (heading) {
		intro = (
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					Save your recovery code
				</h1>
				<p className="text-sm text-base-content/70">{explanation}</p>
			</div>
		)
	} else if (note) {
		intro = <p className="text-sm text-base-content/70">{note}</p>
	}

	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-6">
			{intro}
			<div className="relative rounded-box border border-base-300 p-3">
				<Button
					aria-label={hidden ? "Show recovery code" : "Hide recovery code"}
					aria-pressed={hidden}
					className="absolute top-2 right-2"
					onClick={() => setHidden((value) => !value)}
					shape="circle"
					size="xs"
					type="button"
					variant="ghost"
				>
					{hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</Button>
				<ol
					className="grid grid-cols-2 gap-2 pt-8"
					aria-label={hidden ? "Recovery code hidden" : "Recovery words"}
				>
					{words.map((entry) => (
						<li
							className="flex min-w-0 items-baseline gap-2 rounded-full bg-base-200 px-3 py-2"
							key={entry.label}
						>
							<span className="shrink-0 text-xs text-base-content/50 tabular-nums">
								{entry.label}.
							</span>
							<span className="font-mono text-sm wrap-break-word">
								{hidden ? "••••••••" : entry.word}
							</span>
						</li>
					))}
				</ol>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					onClick={() => void copy(phrase.trim())}
					size="sm"
					type="button"
					variant="ghost"
				>
					{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
					{copied ? "Copied" : "Copy"}
				</Button>
				{copied ? (
					<span className="text-sm text-success">Copied to clipboard</span>
				) : null}
				<Button
					className="ml-auto"
					onClick={() => downloadRecoveryCode(phrase, words)}
					size="sm"
					type="button"
					variant="ghost"
				>
					<Download className="size-4" />
					Download
				</Button>
			</div>
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
