import { useCallback, useRef, useState } from "react"

type UseDisclosureOptions = {
	onClose?: () => void
	onOpen?: () => void
}

type UseDisclosureHandlers = {
	close: () => void
	open: () => void
	set: (value: boolean) => void
	toggle: () => void
}

type UseDisclosureReturnValue = readonly [boolean, UseDisclosureHandlers]

function useDisclosure(
	initialState = false,
	options: UseDisclosureOptions = {}
): UseDisclosureReturnValue {
	const [opened, setOpened] = useState(initialState)
	const openedRef = useRef(initialState)
	const { onClose, onOpen } = options

	const set = useCallback(
		(value: boolean) => {
			if (openedRef.current === value) return

			openedRef.current = value
			setOpened(value)
			if (value) onOpen?.()
			else onClose?.()
		},
		[onClose, onOpen]
	)

	const close = useCallback(() => set(false), [set])
	const open = useCallback(() => set(true), [set])
	const toggle = useCallback(() => set(!openedRef.current), [set])

	return [opened, { close, open, set, toggle }]
}

export { useDisclosure }
export type {
	UseDisclosureHandlers,
	UseDisclosureOptions,
	UseDisclosureReturnValue
}
