import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps, ReactNode } from "react"

const alertVariants = cva("alert", {
	defaultVariants: {
		orientation: "horizontal",
		variant: "light"
	},
	variants: {
		orientation: {
			horizontal: "alert-horizontal",
			vertical: "alert-vertical"
		},
		variant: {
			destructive: "alert-error",
			info: "alert-info",
			light: "alert-soft",
			outline: "alert-outline",
			success: "alert-success",
			warning: "alert-warning"
		}
	}
})

type AlertProps = {
	icon?: ReactNode
} & ComponentProps<"div"> &
	VariantProps<typeof alertVariants>

function Alert({
	className,
	variant,
	children,
	icon,
	...props
}: Readonly<AlertProps>) {
	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		>
			{icon}

			<div>{children}</div>
		</div>
	)
}

function AlertTitle({ className, ...props }: Readonly<ComponentProps<"h3">>) {
	return (
		<h3
			data-slot="alert-title"
			className={cn("font-bold", className)}
			{...props}
		/>
	)
}

function AlertDescription({
	className,
	...props
}: Readonly<ComponentProps<"div">>) {
	return (
		<div
			data-slot="alert-description"
			className={cn("text-sm", className)}
			{...props}
		/>
	)
}

export { Alert, AlertDescription, AlertTitle }
