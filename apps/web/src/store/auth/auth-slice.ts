import { createSlice } from "@reduxjs/toolkit"

import {
	fetchMeAsync,
	loginAsync,
	logoutAsync,
	signupAsync
} from "@/store/auth/extra-reducers"
import type { AuthState } from "@/types"

const initialState: AuthState = {
	user: null,
	initialized: false
}

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		sessionExpired: (state) => {
			state.user = null
		}
	},
	selectors: {
		selectUser: (state) => state.user,
		selectIsAuthenticated: (state) => state.user !== null,
		selectAuthInitialized: (state) => state.initialized
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMeAsync.fulfilled, (state, { payload }) => {
				state.user = payload
				state.initialized = true
			})
			.addCase(fetchMeAsync.rejected, (state) => {
				state.user = null
				state.initialized = true
			})
			.addCase(loginAsync.fulfilled, (state, { payload }) => {
				state.user = payload
				state.initialized = true
			})
			.addCase(signupAsync.fulfilled, (state, { payload }) => {
				state.user = payload
				state.initialized = true
			})
			.addCase(logoutAsync.fulfilled, (state) => {
				state.user = null
				state.initialized = false
			})
	}
})

export const { selectUser, selectIsAuthenticated, selectAuthInitialized } =
	authSlice.selectors
export const { sessionExpired } = authSlice.actions
export default authSlice.reducer
