import { cn } from "cn"
import type { ComponentProps } from "react"

function Dialog({ className, ...props }: ComponentProps<"dialog">) {
	return <dialog className={cn("modal", className)} {...props} />
}

function DialogContent({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("modal-box", className)} {...props} />
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
