import type { ApiType, AppType } from "@keynest/api"
import { hc } from "hono/client"

import { env } from "@/env"

export const API_VERSIONS = ["v1"] as const
export type ApiVersion = (typeof API_VERSIONS)[number]

let handleUnauthorized: (() => void) | undefined

export function onUnauthorized(handler: () => void) {
	handleUnauthorized = handler
}

const fetchWithAuth: typeof fetch = async (input, init) => {
	const res = await fetch(input, { ...init, credentials: "include" })
	if (res.status === 401) handleUnauthorized?.()
	return res
}

export function createClient(version: ApiVersion = "v1") {
	return hc<ApiType>(`${env.VITE_SERVER_URL}/api/${version}`, {
		fetch: fetchWithAuth
	})
}

export const client = createClient()
export const api = hc<AppType>(`${env.VITE_SERVER_URL}/api/health`)
