import type { ComponentProps, ReactNode } from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useDialog } from "@/hooks/use-dialog"

export default function ConfirmDialog({
	children,
	labelledBy,
	onClose,
	open,
	pending = false,
	size
}: Readonly<{
	children: ReactNode
	labelledBy: string
	onClose: () => void
	open: boolean
	pending?: boolean
	size?: ComponentProps<typeof DialogContent>["size"]
}>) {
	const dialogRef = useDialog(open)

	return (
		<Dialog
			aria-labelledby={labelledBy}
			onCancel={(event) => {
				if (pending) event.preventDefault()
			}}
			onClose={() => {
				if (pending) return
				onClose()
			}}
			ref={dialogRef}
		>
			<DialogContent size={size}>{open ? children : null}</DialogContent>
			<form className="modal-backdrop" method="dialog">
				<button disabled={pending} type="submit">
					Close
				</button>
			</form>
		</Dialog>
	)
}
