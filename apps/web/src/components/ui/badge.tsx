import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const badgeVariants = cva("badge", {
	variants: {
		size: {
			lg: "badge-lg",
			md: "badge-md",
			sm: "badge-sm",
			xl: "badge-xl",
			xs: "badge-xs"
		},
		variant: {
			accent: "badge-accent",
			destructive: "badge-error",
			ghost: "badge-ghost",
			info: "badge-info",
			light: "badge-soft",
			neutral: "badge-neutral",
			outline: "badge-outline",
			primary: "badge-primary",
			secondary: "badge-secondary",
			success: "badge-success",
			warning: "badge-warning"
		}
	}
})

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>

export function Badge({
	className,
	size,
	variant,
	...props
}: Readonly<BadgeProps>) {
	return (
		<span
			className={cn(badgeVariants({ size, variant }), className)}
			{...props}
		/>
	)
}
