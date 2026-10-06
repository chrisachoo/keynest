import { useEffect, useState } from "react"

export function useCopyToClipboard(resetAfterMs = 2000) {
	const [hasCopied, setHasCopied] = useState(false)

	useEffect(() => {
		if (!hasCopied) return

		const timeout = setTimeout(() => setHasCopied(false), resetAfterMs)
		return () => clearTimeout(timeout)
	}, [hasCopied, resetAfterMs])

	async function copyToClipboard(text: string) {
		if (!text) return

		try {
			await navigator.clipboard.writeText(text)
			setHasCopied(true)
		} catch {
			setHasCopied(false)
		}
	}

	return { hasCopied, copyToClipboard }
}
