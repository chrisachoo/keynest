import { expect, test } from "bun:test"

import { createAccountSecrets } from "@keynest/utils"

import { placeholderPrelogin } from "./user"

test("placeholder prelogin matches real wrap field sizes", async () => {
	const created = await createAccountSecrets("correct horse battery staple")
	const real = created.secrets
	const placeholder = placeholderPrelogin(
		"test-cookie-secret-at-least-32-chars",
		"nobody@example.com"
	)

	expect(placeholder.recoveryWrappedKey.length).toBe(
		real.recoveryWrappedKey.length
	)
	expect(placeholder.recoveryWrappedKeyNonce.length).toBe(
		real.recoveryWrappedKeyNonce.length
	)
	expect(placeholder.vaultSalt.length).toBe(real.vaultSalt.length)
	expect(placeholder.recoverySalt.length).toBe(real.recoverySalt.length)
})
