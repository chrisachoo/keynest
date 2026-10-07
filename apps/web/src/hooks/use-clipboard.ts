import { useCallback, useEffect, useRef, useState } from "react"

type UseClipboardOptions = {
	timeout?: number
}

export function useClipboard({ timeout = 2000 }: UseClipboardOptions = {}) {
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const requestRef = useRef(0)

	const clearTimer = useCallback(() => {
		if (timeoutRef.current === null) return
		clearTimeout(timeoutRef.current)
		timeoutRef.current = null
	}, [])

	useEffect(() => clearTimer, [clearTimer])

	const reset = useCallback(() => {
		requestRef.current += 1
		clearTimer()
		setCopied(false)
		setError(null)
	}, [clearTimer])

	const copy = useCallback(
		async (text: string) => {
			const requestId = ++requestRef.current

			try {
				await navigator.clipboard.writeText(text)
				if (requestId !== requestRef.current) return

				setError(null)
				setCopied(true)
				clearTimer()
				timeoutRef.current = setTimeout(() => {
					if (requestId !== requestRef.current) return
					setCopied(false)
				}, timeout)
			} catch (cause) {
				if (requestId !== requestRef.current) return

				clearTimer()
				setCopied(false)
				setError(cause instanceof Error ? cause : new Error("Failed to copy"))
			}
		},
		[clearTimer, timeout]
	)

	return { copied, error, copy, reset }
}
