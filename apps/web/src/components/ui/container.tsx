import { cn } from "cn"
import type { ComponentProps } from "react"

export default function Container({
	children,
	className
}: ComponentProps<"main">) {
	return (
		<main
			className={cn("mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12", className)}
		>
			{children}
		</main>
	)
}
