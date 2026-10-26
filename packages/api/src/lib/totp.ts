import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function generateTotpSecret() {
	return base32Encode(randomBytes(20))
}

export function otpauthUrl(email: string, secret: string) {
	const label = encodeURIComponent(`Keynest:${email}`)
	const query = new URLSearchParams({
		algorithm: "SHA1",
		digits: "6",
		issuer: "Keynest",
		period: "30",
		secret
	})
	return `otpauth://totp/${label}?${query.toString()}`
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
	const normalized = code.replaceAll(/\s/g, "")
	if (!/^\d{6}$/.test(normalized)) return false

	const key = base32Decode(secret)
	const counter = Math.floor(now / 30_000)
	const expected = Buffer.from(normalized)
	for (const step of [-1, 0, 1]) {
		const actual = Buffer.from(hotp(key, counter + step))
		if (actual.length === expected.length && timingSafeEqual(actual, expected))
			return true
	}
	return false
}

export function generateRecoveryCodes() {
	return Array.from({ length: 8 }, () => {
		const raw = base32Encode(randomBytes(10)).slice(0, 16).toLowerCase()
		return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`
	})
}

export function normalizeRecoveryCode(code: string) {
	return code.replaceAll(/[\s-]/g, "").toLowerCase()
}

function hotp(key: Buffer, counter: number) {
	const buffer = Buffer.alloc(8)
	buffer.writeBigUInt64BE(BigInt(counter))
	const hmac = createHmac("sha1", key).update(buffer).digest()
	const offset = (hmac.at(-1) ?? 0) & 0x0f
	const binary =
		((hmac[offset]! & 0x7f) << 24) |
		(hmac[offset + 1]! << 16) |
		(hmac[offset + 2]! << 8) |
		hmac[offset + 3]!
	return String(binary % 1_000_000).padStart(6, "0")
}

function base32Encode(bytes: Uint8Array) {
	let bits = 0
	let value = 0
	let output = ""
	for (const byte of bytes) {
		value = (value << 8) | byte
		bits += 8
		while (bits >= 5) {
			output += ALPHABET[(value >>> (bits - 5)) & 31]
			bits -= 5
		}
	}
	if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31]
	return output
}

function base32Decode(input: string) {
	let bits = 0
	let value = 0
	const out: number[] = []
	for (const char of input.replaceAll("=", "").toUpperCase()) {
		const index = ALPHABET.indexOf(char)
		if (index < 0) throw new Error("Invalid authenticator secret")
		value = (value << 5) | index
		bits += 5
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 255)
			bits -= 8
		}
	}
	return Buffer.from(out)
}
