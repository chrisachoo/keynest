import { useEffect, useState } from "react"

function parts(remaining: number) {
	return {
		remaining,
		days: Math.floor(remaining / 86_400),
		hours: Math.floor((remaining % 86_400) / 3_600),
		minutes: Math.floor((remaining % 3_600) / 60),
		seconds: remaining % 60
	}
}

export function useCountdown(expiresAt: string | null) {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		const timer = globalThis.setInterval(() => setNow(Date.now()), 1_000)
		return () => globalThis.clearInterval(timer)
	}, [])

	const deadline = expiresAt ? new Date(expiresAt).getTime() : Number.NaN
	const remaining = Number.isFinite(deadline)
		? Math.max(0, Math.floor((deadline - now) / 1_000))
		: 0

	return parts(remaining)
}
