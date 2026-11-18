import { useEffect, useRef } from "react"

export function useDialog(open: boolean, pending = false) {
	const ref = useRef<HTMLDialogElement>(null)
	const openRef = useRef(open)
	const pendingRef = useRef(pending)

	useEffect(() => {
		openRef.current = open
		pendingRef.current = pending

		const dialog = ref.current
		if (!dialog) return
		if (open && !dialog.open) dialog.showModal()
		if (!open && dialog.open) dialog.close()
		if (!open || !pending) return

		const keepOpen = () => {
			queueMicrotask(() => {
				if (!openRef.current || !pendingRef.current || dialog.open) return
				dialog.showModal()
			})
		}
		dialog.addEventListener("close", keepOpen)
		return () => dialog.removeEventListener("close", keepOpen)
	}, [open, pending])

	return ref
}
