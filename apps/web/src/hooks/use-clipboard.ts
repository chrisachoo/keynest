import { useCallback, useEffect, useRef, useState } from "react"

type UseClipboardOptions = {
	clear?: boolean
	timeout?: number
}

export function useClipboard({
	clear = false,
	timeout = 2000
}: UseClipboardOptions = {}) {
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const requestRef = useRef(0)
	const pendingClear = useRef(false)

	const clearClipboard = useCallback(() => {
		if (!pendingClear.current) return
		pendingClear.current = false
		navigator.clipboard.writeText("").catch(() => undefined)
	}, [])

	const clearTimer = useCallback(() => {
		if (timeoutRef.current === null) return
		clearTimeout(timeoutRef.current)
		timeoutRef.current = null
	}, [])

	useEffect(
		() => () => {
			clearTimer()
			clearClipboard()
		},
		[clearClipboard, clearTimer]
	)

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
				pendingClear.current = clear
				clearTimer()
				timeoutRef.current = setTimeout(() => {
					if (requestId !== requestRef.current) return
					setCopied(false)
					clearClipboard()
				}, timeout)
			} catch (cause) {
				if (requestId !== requestRef.current) return

				clearTimer()
				setCopied(false)
				setError(cause instanceof Error ? cause : new Error("Failed to copy"))
			}
		},
		[clear, clearClipboard, clearTimer, timeout]
	)

	return { copied, error, copy, reset }
}
