import { cn } from "cn"

const meterLevel = {
	fair: { color: "progress-warning", value: 50 },
	strong: { color: "progress-success", value: 67 },
	veryStrong: { color: "progress-primary", value: 83 },
	weak: { color: "progress-error", value: 33 }
} as const

export type MeterLevel = keyof typeof meterLevel

export default function Meter({
	caption,
	level
}: Readonly<{
	caption: string
	level: MeterLevel
}>) {
	const meter = meterLevel[level]

	return (
		<div className="flex items-center gap-2">
			<progress
				className={cn("progress flex-1", meter.color)}
				max={100}
				value={meter.value}
			/>
			<span className="text-xs text-base-content/60">{caption}</span>
		</div>
	)
}
