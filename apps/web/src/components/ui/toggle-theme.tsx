import { MoonIcon, SunIcon } from "lucide-react"
import { useEffect } from "react"

import { useAppDispatch, useAppSelector } from "@/store"
import { setTheme } from "@/store/ui/ui-slice"
import type { Theme } from "@/types"

function applyTheme(theme: Theme) {
	const root = document.documentElement
	root.dataset.theme = theme
	root.style.colorScheme = theme === "sunset" ? "dark" : "light"
}

function ToggleTheme() {
	const dispatch = useAppDispatch()
	const theme = useAppSelector((state) => state.ui.theme)

	useEffect(() => {
		applyTheme(theme)
	}, [theme])

	return (
		<label className="swap swap-rotate btn btn-ghost btn-square">
			<input
				type="checkbox"
				className="theme-controller"
				value="sunset"
				checked={theme === "sunset"}
				onChange={(event) => {
					const next = event.target.checked ? "sunset" : "light"
					applyTheme(next)
					dispatch(setTheme(next))
				}}
			/>
			<SunIcon className="swap-off size-5" />
			<MoonIcon className="swap-on size-5" />
		</label>
	)
}

export default ToggleTheme
