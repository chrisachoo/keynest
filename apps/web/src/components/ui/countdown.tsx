import { cn } from "cn"
import type { ComponentProps, CSSProperties } from "react"

import { useCountdown } from "@/hooks/use-count-down"
import { useAppSelector } from "@/store"
import { selectSessionExpiresAt } from "@/store/auth/auth-slice"

function Label({ value }: Readonly<{ value: number }>) {
	const shown = Math.min(99, Math.max(0, value))

	return (
		<span style={{ "--digits": 2, "--value": shown } as CSSProperties}>
			{shown}
		</span>
	)
}

export function Countdown({ className, ...props }: ComponentProps<"span">) {
	const expiresAt = useAppSelector(selectSessionExpiresAt)
	const { days, hours, minutes, seconds } = useCountdown(expiresAt)
	const label = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`

	return (
		<span
			aria-label={label}
			className={cn("countdown font-mono", className)}
			{...props}
		>
			<Label value={days} />:
			<Label value={hours} />:
			<Label value={minutes} />:
			<Label value={seconds} />
		</span>
	)
}
