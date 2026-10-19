import { env } from "@/env"

export function reportClientError(error: unknown) {
	const message =
		error instanceof Error
			? `${error.name}: ${error.message}`
			: "Unknown client error"

	void fetch(`${env.VITE_SERVER_URL}/api/v1/errors`, {
		body: JSON.stringify({ message: message.slice(0, 500) }),
		credentials: "include",
		headers: { "content-type": "application/json" },
		method: "POST"
	}).catch(() => undefined)
}
