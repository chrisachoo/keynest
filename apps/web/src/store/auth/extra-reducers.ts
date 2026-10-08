import { ClientError, type LoginInput, type SignupInput } from "@keynest/shared"
import { errorMessage, message } from "@keynest/utils"
import { createAsyncThunk } from "@reduxjs/toolkit"

import { lockVault } from "@/components/dashboard/vault-session"
import { client } from "@/lib/client"

export const fetchMeAsync = createAsyncThunk(
	"auth/fetchMeAsync",
	async (_, { rejectWithValue }) => {
		try {
			const response = await client.users.me.$get()

			if (response.status === ClientError.unauthorized)
				return rejectWithValue("unauthorized")
			if (!response.ok) return rejectWithValue(await errorMessage(response))

			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const loginAsync = createAsyncThunk(
	"auth/loginAsync",
	async (credentials: LoginInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.login.$post({ json: credentials })

			if (!response.ok) return rejectWithValue(await errorMessage(response))

			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const signupAsync = createAsyncThunk(
	"auth/signupAsync",
	async (credentials: SignupInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.signup.$post({ json: credentials })

			if (!response.ok) return rejectWithValue(await errorMessage(response))

			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const logoutAsync = createAsyncThunk(
	"auth/logoutAsync",
	async (_, { rejectWithValue }) => {
		lockVault()

		try {
			const res = await client.auth.logout.$post()
			if (!res.ok) return rejectWithValue(await errorMessage(res))
		} catch (e) {
			return rejectWithValue(message(e))
		}
	}
)
