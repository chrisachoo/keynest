// oxlint-disable react/only-export-components
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const buttonVariants = cva("btn", {
	variants: {
		color: {
			accent: "btn-accent",
			neutral: "btn-neutral",
			primary: "btn-primary",
			secondary: "btn-secondary"
		},
		shape: {
			circle: "btn-circle",
			square: "btn-square"
		},
		size: {
			lg: "btn-lg",
			sm: "btn-sm",
			xs: "btn-xs"
		},
		variant: {
			destructive: "btn-error",
			ghost: "btn-ghost",
			light: "btn-soft",
			link: "btn-link",
			outline: "btn-outline",
			primary: "btn-primary"
		}
	}
})

type ButtonProps = ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>

function Button({
	className,
	color,
	shape,
	size,
	variant,
	...props
}: Readonly<ButtonProps>) {
	return (
		<button
			data-slot="button"
			className={cn(buttonVariants({ color, shape, size, variant }), className)}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
export type { ButtonProps }
