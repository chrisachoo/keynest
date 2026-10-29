import {
	PasswordSchema,
	type AuthSession,
	type GoogleStep,
	type OAuthLoginChallenge
} from "@keynest/shared"
import {
	createAccountSecrets,
	installMasterKey,
	lockVault,
	loginSecrets,
	message,
	wipe
} from "@keynest/utils"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import * as v from "valibot"

import {
	googleEnabled,
	preloadGoogle,
	requestGoogleCode
} from "@/lib/google-oauth"
import { useAppDispatch, type AppDispatch } from "@/store"
import {
	confirmTotpAsync,
	googleAuthAsync,
	googleCancelAsync,
	googleCompleteAsync,
	googleConfirmAsync,
	googleStateAsync,
	logoutAsync
} from "@/store/auth/extra-reducers"

const text = (error: unknown) =>
	typeof error === "string" ? error : message(error)

function retryableGoogleError(kind: GoogleStep["kind"], reason: string) {
	if (kind === "totp") return reason === "Incorrect authentication code"
	if (kind === "password") return reason === "Incorrect master password."
	return false
}

function requestGoogleState(
	dispatch: AppDispatch,
	stateRequest: { current: Promise<string> | null },
	stateRef: { current: string | null }
) {
	stateRequest.current ??= dispatch(googleStateAsync())
		.unwrap()
		.then((result) => {
			stateRef.current = result.state
			return result.state
		})
		.finally(() => {
			stateRequest.current = null
		})
	return stateRequest.current
}

/** Google popup sign-in: code exchange, then the step the server asks for. */
export function useGoogleAuth() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const [step, setStep] = useState<GoogleStep | null>(null)
	const [error, setError] = useState<string | null>(null)
	const stateRef = useRef<string | null>(null)
	const stateRequest = useRef<Promise<string> | null>(null)
	const pendingKey = useRef<Uint8Array | null>(null)
	const busy = useRef(false)

	function refreshState() {
		return requestGoogleState(dispatch, stateRequest, stateRef)
	}

	useEffect(() => {
		if (!googleEnabled) return
		preloadGoogle()
		void requestGoogleState(dispatch, stateRequest, stateRef).catch(
			() => undefined
		)
	}, [dispatch])

	function dropKey() {
		const key = pendingKey.current
		pendingKey.current = null
		if (key) wipe(key)
	}

	function cancel(next: string | null = null) {
		let ticket: string | undefined
		if (step?.kind === "password") ticket = step.challenge.ticket
		else if (step?.kind === "totp") ticket = step.ticket

		if (step?.kind === "pending" || ticket)
			void dispatch(googleCancelAsync(ticket))
		dropKey()
		setStep(null)
		setError(next)
		if (googleEnabled) void refreshState().catch(() => undefined)
	}

	async function start() {
		if (busy.current) return
		busy.current = true
		setError(null)
		try {
			if (!stateRef.current) await refreshState()
			const state = stateRef.current
			if (!state) throw new Error("Google sign-in is not ready. Try again.")
			stateRef.current = null
			const code = await requestGoogleCode(state)
			const result = await dispatch(googleAuthAsync({ code, state })).unwrap()
			if ("status" in result)
				setStep({
					kind: "pending",
					profile: { email: result.email, name: result.name }
				})
			else setStep({ challenge: result, kind: "password" })
		} catch (error_) {
			setError(text(error_))
			void refreshState().catch(() => undefined)
		} finally {
			busy.current = false
		}
	}

	async function unlock(masterKey: Uint8Array, session: AuthSession) {
		if (!(await installMasterKey(masterKey, session))) {
			lockVault()
			await dispatch(logoutAsync())
			setStep(null)
			setError("Could not unlock the vault.")
			return
		}
		await navigate("/dashboard", { replace: true })
	}

	async function submitTotp(ticket: string, code: string) {
		const session = await dispatch(
			confirmTotpAsync({ code: code.trim(), ticket })
		).unwrap()
		const key = pendingKey.current
		pendingKey.current = null
		if (!key) throw new Error("Could not unlock the vault.")
		await unlock(key, session)
	}

	async function submitPassword(
		challenge: OAuthLoginChallenge,
		password: string
	) {
		const secrets = await loginSecrets(password, challenge)
		try {
			const result = await dispatch(
				googleConfirmAsync({
					ticket: challenge.ticket,
					verifier: secrets.verifier
				})
			).unwrap()
			if ("totpRequired" in result) {
				pendingKey.current = secrets.masterKey
				setStep({ kind: "totp", ticket: result.ticket })
				return
			}
			await unlock(secrets.masterKey, result)
		} catch (error_) {
			wipe(secrets.masterKey)
			throw error_
		}
	}

	async function submitPending(password: string) {
		const parsed = v.safeParse(PasswordSchema, password)
		if (!parsed.success) {
			setError(parsed.issues[0].message)
			return
		}
		const created = await createAccountSecrets(password)
		let signedIn = false
		try {
			const session = await dispatch(
				googleCompleteAsync(created.secrets)
			).unwrap()
			signedIn = true
			if (!(await installMasterKey(created.masterKey, session))) lockVault()
			setStep({ kind: "recovery", phrase: created.recoveryPhrase })
		} catch (error_) {
			wipe(created.masterKey)
			lockVault()
			if (signedIn) void dispatch(logoutAsync())
			throw error_
		}
	}

	async function submit(value: string) {
		if (!step) return
		setError(null)

		try {
			if (step.kind === "totp") await submitTotp(step.ticket, value)
			else if (step.kind === "password")
				await submitPassword(step.challenge, value)
			else if (step.kind === "pending") await submitPending(value)
		} catch (error_) {
			const reason = text(error_)
			if (retryableGoogleError(step.kind, reason)) setError(reason)
			else cancel(reason)
		}
	}

	return {
		cancel,
		error,
		onGoogle: googleEnabled ? () => void start() : undefined,
		step,
		submit
	}
}

export type GoogleAuth = ReturnType<typeof useGoogleAuth>
