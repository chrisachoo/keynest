import type { Action, ThunkAction } from "@reduxjs/toolkit"
import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector } from "react-redux"
import * as v from "valibot"

import authSlice from "@/store/auth/auth-slice"
import uiSlice from "@/store/ui/ui-slice"
import { ThemeSchema } from "@/types"

export const store = configureStore({
	reducer: {
		auth: authSlice,
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
export type AppThunk<ThunkReturnType = void> = ThunkAction<
	ThunkReturnType,
	RootState,
	unknown,
	Action
>
