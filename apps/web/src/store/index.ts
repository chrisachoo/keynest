import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector } from "react-redux"
import * as v from "valibot"

import uiSlice from "@/store/ui/ui-slice"
import { ThemeSchema } from "@/types"

export const store = configureStore({
	reducer: {
		ui: uiSlice
	},
	preloadedState: {
		ui: {
			theme: v.parse(ThemeSchema, localStorage.getItem("vite-ui-theme"))
		}
	}
})

store.subscribe(() =>
	localStorage.setItem("vite-ui-theme", store.getState().ui.theme)
)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
