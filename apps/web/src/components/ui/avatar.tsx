import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps, ReactNode } from "react"

import { thumbnailShapes, thumbnailSizes } from "@/components/ui/thumbnail"

const avatarVariants = cva("bg-neutral text-neutral-content", {
	defaultVariants: {
		shape: "rounded",
		size: "sm"
	},
	variants: {
		shape: thumbnailShapes,
		size: thumbnailSizes
	}
})

type AvatarProps = Omit<ComponentProps<"div">, "children"> &
	VariantProps<typeof avatarVariants> & {
		children: ReactNode
	}

function Avatar({
	children,
	className,
	shape,
	size,
	...props
}: Readonly<AvatarProps>) {
	return (
		<div className="avatar avatar-placeholder" data-slot="avatar" {...props}>
			<div className={cn(avatarVariants({ shape, size }), className)}>
				<span>{children}</span>
			</div>
		</div>
	)
}

export { Avatar, avatarVariants }
export type { AvatarProps }
