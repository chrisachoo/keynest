import { expect, test } from "bun:test"

import { hashVerifier, verifierMatches } from "./password"

test("verifierMatches accepts only the stored hash", () => {
	const stored = hashVerifier("verifier")

	expect(verifierMatches("verifier", stored)).toBe(true)
	expect(verifierMatches("other", stored)).toBe(false)
	expect(verifierMatches("verifier", null)).toBe(false)
	expect(verifierMatches("verifier", "not-a-hash")).toBe(false)
})
