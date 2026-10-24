import { redirect } from "react-router"

import { store } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"
import { fetchMeAsync } from "@/store/auth/extra-reducers"

async function getUser() {
	await store.dispatch(fetchMeAsync())
	return selectUser(store.getState())
}

export async function requireAuth() {
	if (!(await getUser())) throw redirect("/login")
	return null
}

export async function redirectIfAuthed() {
	if (await getUser()) throw redirect("/dashboard")
	return null
}
