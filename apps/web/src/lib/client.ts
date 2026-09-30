import type { ApiType, AppType } from "@keynest/api"
import { hc } from "hono/client"

import { env } from "@/env"

export const API_VERSIONS = ["v1"] as const
export type ApiVersion = (typeof API_VERSIONS)[number]

export function createClient(version: ApiVersion = "v1") {
	return hc<ApiType>(`${env.VITE_SERVER_URL}/api/${version}`, {
		init: { credentials: "include" }
	})
}

export const client = createClient()
export const api = hc<AppType>(`${env.VITE_SERVER_URL}/api/health`)
