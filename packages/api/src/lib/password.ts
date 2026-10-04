import { timingSafeEqual } from "node:crypto"

const ITERATIONS = 600_000
const SALT_BYTES = 16
const KEY_BYTES = 32

const DUMMY_PASSWORD_HASH =
	"pbkdf2$600000$gkjJsT4dZCMxuGTgfuwSkg$mwZ3-tCv1SOj6NJzJMsJIUMsaijNzLpikV4Rp6g85J0"

function encode(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64url")
}

function decode(value: string): Uint8Array | null {
	try {
		const bytes = Buffer.from(value, "base64url")
		return bytes.length > 0 ? new Uint8Array(bytes) : null
	} catch {
		return null
	}
}

async function derive(
	password: string,
	salt: Uint8Array,
	iterations: number
): Promise<Uint8Array> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	)
	const bits = await crypto.subtle.deriveBits(
		{
			hash: "SHA-256",
			iterations,
			name: "PBKDF2",
			salt: Buffer.from(salt)
		},
		keyMaterial,
		KEY_BYTES * 8
	)
	return new Uint8Array(bits)
}

/** PBKDF2-HMAC-SHA256 at the OWASP iteration count. Web Crypto runs in Workers. */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
	const key = await derive(password, salt, ITERATIONS)
	return `pbkdf2$${ITERATIONS}$${encode(salt)}$${encode(key)}`
}

export async function verifyPassword(
	password: string,
	encoded: string
): Promise<boolean> {
	const [scheme, rounds, saltB64, hashB64] = encoded.split("$")
	if (scheme !== "pbkdf2" || !rounds || !saltB64 || !hashB64) return false

	const iterations = Number(rounds)
	if (!Number.isInteger(iterations) || iterations < 1) return false

	const salt = decode(saltB64)
	const expected = decode(hashB64)
	if (!salt || !expected) return false

	const actual = await derive(password, salt, iterations)
	if (actual.byteLength !== expected.byteLength) return false

	return timingSafeEqual(actual, expected)
}

export async function passwordMatches(
	password: string,
	hash: string | null
): Promise<boolean> {
	const valid = await verifyPassword(password, hash ?? DUMMY_PASSWORD_HASH)
	return hash !== null && valid
}
