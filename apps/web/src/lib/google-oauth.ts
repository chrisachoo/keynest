import { env } from "@/env"

const GSI_SRC = "https://accounts.google.com/gsi/client"

type CodeResponse = { code?: string; error?: string; state?: string }

type CodeClient = { requestCode: () => void }

type GoogleAccounts = {
	accounts: {
		oauth2: {
			initCodeClient: (config: {
				callback: (response: CodeResponse) => void
				client_id: string
				error_callback?: (error: { type: string }) => void
				scope: string
				select_account: true
				state: string
				ux_mode: "popup"
			}) => CodeClient
		}
	}
}

let gsiLoad: Promise<GoogleAccounts> | undefined

function loadGsi(): Promise<GoogleAccounts> {
	gsiLoad ??= new Promise((resolve, reject) => {
		const script = document.createElement("script")
		script.src = GSI_SRC
		script.async = true
		script.addEventListener("load", () =>
			resolve((globalThis as unknown as { google: GoogleAccounts }).google)
		)
		script.addEventListener("error", () => {
			gsiLoad = undefined
			reject(new Error("Could not load Google sign-in."))
		})
		document.head.appendChild(script)
	})
	return gsiLoad
}

/** Load the library ahead of the click so the popup opens inside the user gesture. */
export function preloadGoogle(): void {
	if (googleEnabled) void loadGsi().catch(() => undefined)
}

export const googleEnabled = Boolean(env.VITE_GOOGLE_CLIENT_ID)

/** Opens the Google popup and resolves with a one-time authorization code. */
export async function requestGoogleCode(state: string): Promise<string> {
	const clientId = env.VITE_GOOGLE_CLIENT_ID
	if (!clientId) throw new Error("Google sign-in is not configured.")

	const google = await loadGsi()
	return new Promise((resolve, reject) => {
		google.accounts.oauth2
			.initCodeClient({
				callback: (response) =>
					response.code && response.state === state
						? resolve(response.code)
						: reject(new Error("Google sign-in was cancelled.")),
				client_id: clientId,
				error_callback: () =>
					reject(new Error("Google sign-in was cancelled.")),
				scope: "openid email profile",
				select_account: true,
				state,
				ux_mode: "popup"
			})
			.requestCode()
	})
}
