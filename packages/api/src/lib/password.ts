import { createHash, timingSafeEqual } from "node:crypto"

const DUMMY_VERIFIER_HASH = createHash("sha256")
	.update("keynest.verifier.dummy")
	.digest("hex")

/** Hash of the client-stretched verifier. The master password never reaches the server. */
export function hashVerifier(verifier: string): string {
	return createHash("sha256").update(verifier).digest("hex")
}

export function verifierMatches(
	verifier: string,
	stored: string | null
): boolean {
	const actual = Buffer.from(hashVerifier(verifier), "hex")
	const expectedHex =
		stored && /^[a-f0-9]{64}$/.test(stored) ? stored : DUMMY_VERIFIER_HASH
	const matches = timingSafeEqual(actual, Buffer.from(expectedHex, "hex"))
	return stored === expectedHex && matches
}
