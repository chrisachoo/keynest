import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const checkboxVariants = cva("checkbox", {
	variants: {
		color: {
			accent: "checkbox-accent",
			error: "checkbox-error",
			neutral: "checkbox-neutral",
			primary: "checkbox-primary",
			secondary: "checkbox-secondary",
			success: "checkbox-success"
		},
		size: {
			lg: "checkbox-lg",
			sm: "checkbox-sm",
			xs: "checkbox-xs"
		}
	}
})

type CheckboxProps = Omit<ComponentProps<"input">, "type"> &
	VariantProps<typeof checkboxVariants>

function Checkbox({
	className,
	color,
	size,
	...props
}: Readonly<CheckboxProps>) {
	return (
		<input
			className={cn(checkboxVariants({ color, size }), className)}
			type="checkbox"
			{...props}
		/>
	)
}

export { Checkbox, checkboxVariants }
export type { CheckboxProps }
