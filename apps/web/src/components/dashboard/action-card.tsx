import { ChevronRight, type LucideIcon } from "lucide-react"

import { IconBadge } from "@/components/ui/icon-badge"

export function ActionCard({
	description,
	icon: Icon,
	onClick,
	title
}: Readonly<{
	description: string
	icon: LucideIcon
	onClick: () => void
	title: string
}>) {
	return (
		<button
			className="card border border-base-200 bg-base-100 text-left card-sm card-border hover:bg-base-200"
			onClick={onClick}
			type="button"
		>
			<div className="card-body flex-row items-center gap-3">
				<IconBadge>
					<Icon className="size-4" />
				</IconBadge>
				<span className="min-w-0 flex-1">
					<span className="card-title text-sm">{title}</span>
					<span className="mt-1 block text-xs text-base-content/60">
						{description}
					</span>
				</span>
				<ChevronRight className="size-4 opacity-60" />
			</div>
		</button>
	)
}
