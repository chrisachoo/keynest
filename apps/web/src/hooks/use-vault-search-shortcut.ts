import { useEffect } from "react"

export function useVaultSearchShortcut(onToggle: () => void) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() !== "k") return
			if (!event.metaKey && !event.ctrlKey) return
			event.preventDefault()
			onToggle()
		}

		globalThis.addEventListener("keydown", onKeyDown)
		return () => globalThis.removeEventListener("keydown", onKeyDown)
	}, [onToggle])
}
