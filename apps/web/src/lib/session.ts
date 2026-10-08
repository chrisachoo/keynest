import { client, onUnauthorized } from "@/lib/client"
import { lockVault } from "@/lib/vault/vault-session"
import { router } from "@/routes"
import { store } from "@/store"
import {
	selectSessionExpiresAt,
	selectUser,
	sessionExpired
} from "@/store/auth/auth-slice"
import { fetchMeAsync } from "@/store/auth/extra-reducers"

let expiryTimer: ReturnType<typeof setTimeout> | null = null
let armedExpiresAt: string | null = null
let expiring = false
let revalidating = false
let lastRevalidate = 0

async function expireSession() {
	if (expiring || !selectUser(store.getState())) return

	expiring = true
	lockVault()
	store.dispatch(sessionExpired())

	try {
		await router.navigate("/login", { replace: true })
		await client.auth.logout.$post()
	} finally {
		expiring = false
	}
}

function armSessionExpiry(expiresAt: string | null) {
	if (expiryTimer !== null) {
		clearTimeout(expiryTimer)
		expiryTimer = null
	}

	armedExpiresAt = expiresAt
	if (!expiresAt) return

	const delay = new Date(expiresAt).getTime() - Date.now()
	if (delay <= 0) {
		void expireSession()
		return
	}

	expiryTimer = setTimeout(() => {
		void expireSession()
	}, delay)
}

async function revalidateSession() {
	if (revalidating || expiring || !selectUser(store.getState())) return
	if (Date.now() - lastRevalidate < 1_000) return
	lastRevalidate = Date.now()

	const expiresAt = selectSessionExpiresAt(store.getState())
	if (expiresAt && Date.now() >= new Date(expiresAt).getTime()) {
		void expireSession()
		return
	}

	revalidating = true
	try {
		await store.dispatch(fetchMeAsync())
	} finally {
		revalidating = false
	}
}

onUnauthorized(() => {
	void expireSession()
})

armSessionExpiry(selectSessionExpiresAt(store.getState()))

store.subscribe(() => {
	const expiresAt = selectSessionExpiresAt(store.getState())
	if (expiresAt === armedExpiresAt) return
	armSessionExpiry(expiresAt)
})

document.addEventListener("visibilitychange", () => {
	if (document.visibilityState !== "visible") return
	void revalidateSession()
})

globalThis.addEventListener("focus", () => {
	void revalidateSession()
})
