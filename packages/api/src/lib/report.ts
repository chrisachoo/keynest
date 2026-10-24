const CLIENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

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

async function pruneClientErrors(db: D1Database) {
	await db
		.prepare(
			"DELETE FROM error_report WHERE source = 'client' AND created_at < ?"
		)
		.bind(Date.now() - CLIENT_RETENTION_MS)
		.run()
}

export async function recordError(
	db: D1Database,
	source: "client" | "server",
	message: string
) {
	const text = redactErrorMessage(message)
	if (!text) return

	if (source === "client") await pruneClientErrors(db)

	await db
		.prepare(
			"INSERT INTO error_report (id, source, message, created_at) VALUES (?, ?, ?, ?)"
		)
		.bind(crypto.randomUUID(), source, text, Date.now())
		.run()
}
