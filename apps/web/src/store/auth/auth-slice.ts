import type { AuthSession } from "@keynest/shared"
import { createSlice } from "@reduxjs/toolkit"

import {
	fetchMeAsync,
	loginAsync,
	logoutAsync,
	signupAsync
} from "@/store/auth/extra-reducers"
import type { AuthState } from "@/types"

const initialState: AuthState = {
	initialized: false,
	sessionExpiresAt: null,
	user: null
}

function applySession(state: AuthState, payload: AuthSession) {
	const { sessionExpiresAt, ...user } = payload
	state.user = user
	state.sessionExpiresAt = sessionExpiresAt
	state.initialized = true
}

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		sessionExpired: (state) => {
			state.sessionExpiresAt = null
			state.user = null
		}
	},
	selectors: {
		selectUser: (state) => state.user,
		selectIsAuthenticated: (state) => state.user !== null,
		selectSessionExpiresAt: (state) => state.sessionExpiresAt
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMeAsync.fulfilled, (state, action) => {
				applySession(state, action.payload)
			})
			.addCase(fetchMeAsync.rejected, (state, action) => {
				state.initialized = true
				if (action.payload !== "unauthorized") return
				state.sessionExpiresAt = null
				state.user = null
			})
			.addCase(loginAsync.fulfilled, (state, action) => {
				applySession(state, action.payload)
			})
			.addCase(signupAsync.fulfilled, (state, action) => {
				applySession(state, action.payload)
			})
			.addCase(logoutAsync.fulfilled, (state) => {
				state.sessionExpiresAt = null
				state.user = null
				state.initialized = false
			})
	}
})

export const { selectUser, selectIsAuthenticated, selectSessionExpiresAt } =
	authSlice.selectors
export const { sessionExpired } = authSlice.actions
export default authSlice.reducer
