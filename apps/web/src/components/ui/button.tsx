import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const buttonVariants = cva("btn", {
	variants: {
		color: {
			accent: "btn-accent",
			default: "btn-neutral",
			primary: "btn-primary",
			secondary: "btn-secondary"
		},
		size: {
			lg: "btn-lg",
			sm: "btn-sm"
		},
		variant: {
			destructive: "btn-error",
			ghost: "btn-ghost",
			light: "btn-soft",
			link: "btn-link",
			outline: "btn-outline ",
			primary: "btn-primary"
		}
	}
})

type ButtonProps = ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: Readonly<ButtonProps>) {
	return (
		<button
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
export type { ButtonProps }
