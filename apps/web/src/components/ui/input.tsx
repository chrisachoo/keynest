// oxlint-disable react/only-export-components
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const inputVariants = cva("input w-full", {
	variants: {
		color: {
			accent: "input-accent",
			error: "input-error",
			info: "input-info",
			neutral: "input-neutral",
			primary: "input-primary",
			secondary: "input-secondary",
			success: "input-success",
			warning: "input-warning"
		},
		size: {
			lg: "input-lg",
			sm: "input-sm",
			xs: "input-xs"
		},
		variant: {
			ghost: "input-ghost"
		}
	}
})

type InputProps = ComponentProps<"input"> & VariantProps<typeof inputVariants>

function Input({
	className,
	color,
	size,
	variant,
	...props
}: Readonly<InputProps>) {
	return (
		<input
			className={cn(inputVariants({ color, size, variant }), className)}
			{...props}
		/>
	)
}

function InputGroup({ className, ...props }: ComponentProps<"label">) {
	return <label className={cn("input w-full", className)} {...props} />
}

function Legend({ className, ...props }: ComponentProps<"legend">) {
	return <legend className={cn("fieldset-legend", className)} {...props} />
}

function Fieldset({ className, ...props }: ComponentProps<"fieldset">) {
	return <fieldset className={cn("fieldset", className)} {...props} />
}

export { Fieldset, Input, InputGroup, inputVariants, Legend }
export type { InputProps }
