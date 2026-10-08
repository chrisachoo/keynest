export const message = (e: unknown) =>
	e instanceof Error ? e.message : "Something went wrong"

export async function errorMessage(res: { json(): Promise<unknown> }) {
	const body: unknown = await res.json().catch(() => null)

	if (
		typeof body === "object" &&
		body !== null &&
		"message" in body &&
		typeof body.message === "string"
	) {
		return body.message
	}

	return "Request failed"
}
