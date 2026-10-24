import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const rangeVariants = cva("range", {
	variants: {
		color: {
			accent: "range-accent",
			error: "range-error",
			neutral: "range-neutral",
			primary: "range-primary",
			secondary: "range-secondary",
			success: "range-success"
		},
		size: {
			lg: "range-lg",
			sm: "range-sm",
			xs: "range-xs"
		}
	}
})

type RangeProps = Omit<ComponentProps<"input">, "type"> &
	VariantProps<typeof rangeVariants>

function Range({ className, color, size, ...props }: Readonly<RangeProps>) {
	return (
		<input
			className={cn(rangeVariants({ color, size }), className)}
			type="range"
			{...props}
		/>
	)
}

export { Range, rangeVariants }
export type { RangeProps }
