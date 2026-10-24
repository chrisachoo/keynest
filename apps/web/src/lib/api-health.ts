import { env } from "@/env"

export type ApiHealthState = "healthy" | "unhealthy"

export async function fetchApiHealth(): Promise<ApiHealthState> {
	try {
		const response = await fetch(`${env.VITE_SERVER_URL}/api/health`)
		if (!response.ok) return "unhealthy"

		const body = (await response.json()) as { ok?: boolean }
		return body.ok === true ? "healthy" : "unhealthy"
	} catch {
		return "unhealthy"
	}
}
