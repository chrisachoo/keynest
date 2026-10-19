import { expect, test } from "bun:test"

import { openBytes, randomBytes, sealBytes } from "./crypto"

test("sealBytes round-trips with the same key and associated data", async () => {
	const key = await crypto.subtle.generateKey(
		{ length: 256, name: "AES-GCM" },
		false,
		["encrypt", "decrypt"]
	)
	const plaintext = randomBytes(16)
	const aad = new TextEncoder().encode("keynest.test")
	const sealed = await sealBytes(key, plaintext, aad)
	const opened = await openBytes(key, sealed.ciphertext, sealed.nonce, aad)

	expect(opened).toEqual(plaintext)
})

test("openBytes rejects different associated data", async () => {
	const key = await crypto.subtle.generateKey(
		{ length: 256, name: "AES-GCM" },
		false,
		["encrypt", "decrypt"]
	)
	const sealed = await sealBytes(
		key,
		new TextEncoder().encode("secret"),
		new TextEncoder().encode("item-a")
	)

	await expect(
		openBytes(
			key,
			sealed.ciphertext,
			sealed.nonce,
			new TextEncoder().encode("item-b")
		)
	).rejects.toThrow()
})
