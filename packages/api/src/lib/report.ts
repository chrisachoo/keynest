const LABELED_SECRET =
	/\b((?:token|code|password|verifier|secret|phrase)=)\S+/gi
const BEARER = /\b(bearer\s+)\S+/gi
const LONG_TOKEN = /\b[A-Za-z0-9_-]{40,}\b/g

export function redactErrorMessage(value: string) {
	return value
		.replace(LABELED_SECRET, "$1[redacted]")
		.replace(BEARER, "$1[redacted]")
		.replace(LONG_TOKEN, "[redacted]")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 300)
}

export async function recordError(
	db: D1Database,
	source: "client" | "server",
	message: string
) {
	const text = redactErrorMessage(message)
	if (!text) return

	await db
		.prepare(
			"INSERT INTO error_report (id, source, message, created_at) VALUES (?, ?, ?, ?)"
		)
		.bind(crypto.randomUUID(), source, text, Date.now())
		.run()
}
