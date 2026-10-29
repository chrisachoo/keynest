import {
	ClientError,
	type ChangePasswordInput,
	type DeleteAccountInput,
	type LoginInput,
	type OAuthCodeInput,
	type OAuthCompleteInput,
	type OAuthConfirmInput,
	type RecoverInput,
	type SignupInput,
	type TotpConfirmLoginInput
} from "@keynest/shared"
import { errorMessage, lockVault, message } from "@keynest/utils"
import { createAsyncThunk } from "@reduxjs/toolkit"

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

export const confirmTotpAsync = createAsyncThunk(
	"auth/confirmTotpAsync",
	async (input: TotpConfirmLoginInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.totp.$post({ json: input })
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

export const googleStateAsync = createAsyncThunk(
	"auth/googleStateAsync",
	async (_, { rejectWithValue }) => {
		try {
			const response = await client.auth.oauth.google.state.$post()
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const googleAuthAsync = createAsyncThunk(
	"auth/googleAuthAsync",
	async (input: OAuthCodeInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.oauth.google.$post(
				{ json: input },
				{ headers: { "X-Requested-With": "XmlHttpRequest" } }
			)
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const googleConfirmAsync = createAsyncThunk(
	"auth/googleConfirmAsync",
	async (input: OAuthConfirmInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.oauth.google.confirm.$post({
				json: input
			})
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const googleCancelAsync = createAsyncThunk(
	"auth/googleCancelAsync",
	async (ticket: string | undefined, { rejectWithValue }) => {
		try {
			const response = await client.auth.oauth.google.cancel.$post({
				json: ticket ? { ticket } : {}
			})
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return null
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const googleCompleteAsync = createAsyncThunk(
	"auth/googleCompleteAsync",
	async (input: OAuthCompleteInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.oauth.google.complete.$post({
				json: input
			})
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const changePasswordAsync = createAsyncThunk(
	"auth/changePasswordAsync",
	async (input: ChangePasswordInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.password.$post({ json: input })
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const recoverAsync = createAsyncThunk(
	"auth/recoverAsync",
	async (input: RecoverInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.recover.$post({ json: input })
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			return await response.json()
		} catch (error) {
			return rejectWithValue(message(error))
		}
	}
)

export const deleteAccountAsync = createAsyncThunk(
	"auth/deleteAccountAsync",
	async (input: DeleteAccountInput, { rejectWithValue }) => {
		try {
			const response = await client.auth.delete.$post({ json: input })
			if (!response.ok) return rejectWithValue(await errorMessage(response))
			lockVault()
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
