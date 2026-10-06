import { client, onUnauthorized } from "@/lib/client"
import { router } from "@/routes"
import { store } from "@/store"
import { selectUser, sessionExpired } from "@/store/auth/auth-slice"

onUnauthorized(async () => {
	if (!selectUser(store.getState())) return

	store.dispatch(sessionExpired())
	await router.navigate("/login", { replace: true })
	void client.auth.logout.$post()
})
