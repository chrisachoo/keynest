import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { Theme, UIState } from "@/types"

const initialState: UIState = {
	theme: "light"
}

const uiSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		setTheme: (state, action: PayloadAction<Theme>) => {
			state.theme = action.payload
		}
	}
})

export const { setTheme } = uiSlice.actions
export default uiSlice.reducer
