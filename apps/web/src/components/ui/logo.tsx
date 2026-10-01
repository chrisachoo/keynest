import { KeyRound } from "lucide-react"

export function Logo() {
	return (
		<div className="flex items-center gap-2">
			<div className="flex size-8 items-center justify-center rounded-field bg-primary text-primary-content">
				<KeyRound className="size-4" />
			</div>
			<span className="text-base font-semibold tracking-tight">keynest</span>
		</div>
	)
}
