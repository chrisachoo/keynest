import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { ComponentProps } from "react"

const dialogContentVariants = cva("modal-box", {
	defaultVariants: {
		size: "md"
	},
	variants: {
		size: {
			sm: "w-full max-w-sm",
			md: "max-w-lg",
			lg: "w-full max-w-2xl"
		}
	}
})

function Dialog({ className, ...props }: ComponentProps<"dialog">) {
	return <dialog className={cn("modal", className)} {...props} />
}

function DialogContent({
	className,
	size,
	...props
}: ComponentProps<"div"> & VariantProps<typeof dialogContentVariants>) {
	return (
		<div
			className={cn(dialogContentVariants({ size }), className)}
			{...props}
		/>
	)
}

function DialogTitle({ className, ...props }: ComponentProps<"h3">) {
	return <h3 className={cn("text-lg font-bold", className)} {...props} />
}

function DialogAction({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("modal-action", className)} {...props} />
}

function DialogActionForm({
	action = "dialog",
	...props
}: ComponentProps<"form">) {
	return <form action={action} {...props} />
}

export { Dialog, DialogAction, DialogActionForm, DialogContent, DialogTitle }
