import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps, ReactNode } from "react"

import { thumbnailShapes, thumbnailSizes } from "@/components/ui/thumbnail"

const avatarColors = [
	"bg-primary text-primary-content",
	"bg-secondary text-secondary-content",
	"bg-accent text-accent-content",
	"bg-info text-info-content",
	"bg-success text-success-content",
	"bg-warning text-warning-content",
	"bg-error text-error-content"
] as const

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

function getAvatarColor(value: string) {
	let hash = 0

	for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0

	return avatarColors[Math.abs(hash) % avatarColors.length]
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

export { Avatar, avatarVariants, getAvatarColor }
export type { AvatarProps }
