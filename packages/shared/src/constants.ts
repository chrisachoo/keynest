export const VAULT_ITEM_TYPES = ["login", "secure_note"] as const
export const CREDENTIAL_PROVIDER = "credential"
export const SESSION_COOKIE = "session"

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const VAULT_IDLE_MS = 5 * 60 * 1000
export const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
export const TOTP_TICKET_TTL_MS = 5 * 60 * 1000
export const TOTP_MAX_ATTEMPTS = 5
export const VAULT_PAGE_SIZE = 50
export const VAULT_CIPHERTEXT_MAX = 65_536

export const SALT_BYTES = 16
export const KDF_MEMORY_KIB = 65_536
export const KDF_ITERATIONS = 3
export const KDF_PARALLELISM = 1
export const KDF_HASH_BYTES = 32
export const RECOVERY_WORD_COUNT = 8
export const VAULT_EXPORT_VERSION = 1
export const CLIPBOARD_TIMEOUT = 15_000
export const DRAWER_HIDE_TIMEOUT = 300
export const PAYLOAD_VERSION = 1

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
