import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes
} from "node:crypto"

function key(secret: string) {
	return createHash("sha256").update(secret).digest()
}

export function sealString(plaintext: string, secret: string) {
	const iv = randomBytes(12)
	const cipher = createCipheriv("aes-256-gcm", key(secret), iv)
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final()
	])
	return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
		"base64url"
	)
}

export function openString(packed: string, secret: string) {
	const bytes = Buffer.from(packed, "base64url")
	const decipher = createDecipheriv(
		"aes-256-gcm",
		key(secret),
		bytes.subarray(0, 12)
	)
	decipher.setAuthTag(bytes.subarray(12, 28))
	return Buffer.concat([
		decipher.update(bytes.subarray(28)),
		decipher.final()
	]).toString("utf8")
}
