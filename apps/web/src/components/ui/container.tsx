import { cn } from "cn"
import type { ComponentProps } from "react"

export function Container({ children, className }: ComponentProps<"div">) {
	return (
		<div
			className={cn("mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12", className)}
		>
			{children}
		</div>
	)
}
