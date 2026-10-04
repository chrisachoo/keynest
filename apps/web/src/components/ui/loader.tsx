import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const loadingVariants = cva("loading", {
	defaultVariants: {
		variant: "spinner"
	},
	variants: {
		color: {
			accent: "text-accent",
			error: "text-error",
			info: "text-info",
			neutral: "text-neutral",
			primary: "text-primary",
			secondary: "text-secondary",
			success: "text-success",
			warning: "text-warning"
		},
		size: {
			lg: "loading-lg",
			md: "loading-md",
			sm: "loading-sm",
			xl: "loading-xl",
			xs: "loading-xs"
		},
		variant: {
			ball: "loading-ball",
			bars: "loading-bars",
			dots: "loading-dots",
			infinity: "loading-infinity",
			ring: "loading-ring",
			spinner: "loading-spinner"
		}
	}
})

type LoadingProps = ComponentProps<"span"> &
	VariantProps<typeof loadingVariants>

export function Loading({
	className,
	color,
	size,
	variant,
	...props
}: Readonly<LoadingProps>) {
	return (
		<span
			className={cn(
				loadingVariants({
					color,
					size,
					variant
				}),
				className
			)}
			{...props}
		/>
	)
}
