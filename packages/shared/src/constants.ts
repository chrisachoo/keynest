export const VAULT_ITEM_TYPES = ["login", "secure_note"] as const
export const CREDENTIAL_PROVIDER = "credential"
export const SESSION_COOKIE = "session"

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const VAULT_IDLE_MS = 5 * 60 * 1000

export const SALT_BYTES = 16
export const CLIPBOARD_TIMEOUT = 15_000
export const DRAWER_HIDE_TIMEOUT = 300

export const TYPE_NAMES = {
	login: "Login",
	secure_note: "Note"
} as const

export const SECRET_LABELS = {
	login: "password",
	secure_note: "note"
} as const

export const FIELD_LABELS = {
	login: "Password",
	secure_note: "Note"
} as const
