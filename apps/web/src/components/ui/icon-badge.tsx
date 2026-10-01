import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps, ReactNode } from "react"

import { thumbnailShapes, thumbnailSizes } from "@/components/ui/thumbnail"

const iconBadgeVariants = cva(
	"inline-flex shrink-0 items-center justify-center bg-base-200 text-base-content",
	{
		defaultVariants: {
			shape: "square",
			size: "sm"
		},
		variants: {
			shape: thumbnailShapes,
			size: thumbnailSizes
		}
	}
)

type IconBadgeProps = Omit<ComponentProps<"div">, "children"> &
	VariantProps<typeof iconBadgeVariants> & {
		children: ReactNode
	}

function IconBadge({
	children,
	className,
	shape,
	size,
	...props
}: Readonly<IconBadgeProps>) {
	return (
		<div
			className={cn(iconBadgeVariants({ shape, size }), className)}
			data-slot="icon-badge"
			{...props}
		>
			{children}
		</div>
	)
}

export { IconBadge, iconBadgeVariants }
export type { IconBadgeProps }
