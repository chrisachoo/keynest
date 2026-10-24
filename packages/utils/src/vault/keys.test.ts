import { expect, test } from "bun:test"

import {
	KDF_ITERATIONS,
	KDF_MEMORY_KIB,
	KDF_PARALLELISM,
	PAYLOAD_VERSION
} from "@keynest/shared"

import { openPayload, sealPayload } from "./crypto"
import {
	changePasswordSecrets,
	createAccountSecrets,
	dataKeyFrom,
	loginSecrets,
	recoverSecrets,
	rotateRecoverySecrets,
	wipe
} from "./keys"

const PASSWORD = "correct horse battery staple"
const NEXT_PASSWORD = "another correct horse battery"

function kdf() {
	return {
		kdfIterations: KDF_ITERATIONS,
		kdfMemory: KDF_MEMORY_KIB,
		kdfParallelism: KDF_PARALLELISM
	}
}

test("signup, login, password change, and recovery keep the same vault secret", async () => {
	const created = await createAccountSecrets(PASSWORD)
	const material = { ...created.secrets, ...kdf() }
	const key = await dataKeyFrom(created.masterKey, material)
	expect(key).not.toBeNull()
	wipe(created.masterKey)

	const id = crypto.randomUUID()
	const sealed = await sealPayload(key!, id, {
		name: "Example",
		schemaVersion: PAYLOAD_VERSION,
		secret: "stored-secret",
		type: "login",
		username: "ada"
	})
	const record = { ...sealed, id, type: "login" as const }

	const login = await loginSecrets(PASSWORD, material)
	const unlocked = await dataKeyFrom(login.masterKey, material)
	expect(await openPayload(unlocked, record)).toMatchObject({
		secret: "stored-secret"
	})
	wipe(login.masterKey)

	const wrong = await loginSecrets("wrong password phrase", material)
	await expect(dataKeyFrom(wrong.masterKey, material)).rejects.toThrow(
		"Incorrect password."
	)
	wipe(wrong.masterKey)

	const changed = await changePasswordSecrets(PASSWORD, NEXT_PASSWORD, material)
	const changedMaterial = { ...material, ...changed }
	const relocked = await loginSecrets(NEXT_PASSWORD, changedMaterial)
	const changedKey = await dataKeyFrom(relocked.masterKey, changedMaterial)
	expect(await openPayload(changedKey, record)).toMatchObject({
		secret: "stored-secret"
	})
	wipe(relocked.masterKey)

	const recovered = await recoverSecrets(
		created.recoveryPhrase,
		"third password phrase",
		material
	)
	const recoveredKey = await dataKeyFrom(recovered.masterKey, {
		...material,
		...recovered.request
	})
	expect(await openPayload(recoveredKey, record)).toMatchObject({
		secret: "stored-secret"
	})
	wipe(recovered.masterKey)
}, 120_000)

test("a new recovery phrase replaces the old one only after it is saved", async () => {
	const created = await createAccountSecrets(PASSWORD)
	const material = { ...created.secrets, ...kdf() }
	const key = await dataKeyFrom(created.masterKey, material)
	expect(key).not.toBeNull()
	wipe(created.masterKey)

	const id = crypto.randomUUID()
	const sealed = await sealPayload(key!, id, {
		name: "Example",
		schemaVersion: PAYLOAD_VERSION,
		secret: "stored-secret",
		type: "login",
		username: "ada"
	})
	const record = { ...sealed, id, type: "login" as const }

	const rotated = await rotateRecoverySecrets(PASSWORD, material)
	const stillOld = await recoverSecrets(
		created.recoveryPhrase,
		"fresh password phrase",
		material
	)
	const stillOldKey = await dataKeyFrom(stillOld.masterKey, {
		...material,
		...stillOld.request
	})
	expect(await openPayload(stillOldKey, record)).toMatchObject({
		secret: "stored-secret"
	})
	wipe(stillOld.masterKey)

	const saved = {
		...material,
		recoverySalt: rotated.request.recoverySalt,
		recoveryWrappedKey: rotated.request.recoveryWrappedKey,
		recoveryWrappedKeyNonce: rotated.request.recoveryWrappedKeyNonce
	}
	expect(saved.wrappedKey).toBe(material.wrappedKey)

	const login = await loginSecrets(PASSWORD, saved)
	const loginKey = await dataKeyFrom(login.masterKey, saved)
	expect(await openPayload(loginKey, record)).toMatchObject({
		secret: "stored-secret"
	})
	wipe(login.masterKey)

	await expect(
		recoverSecrets(created.recoveryPhrase, "another fresh phrase", saved)
	).rejects.toThrow("Recovery code is incorrect.")

	const opened = await recoverSecrets(
		rotated.phrase,
		"saved phrase password",
		saved
	)
	const openedKey = await dataKeyFrom(opened.masterKey, {
		...saved,
		...opened.request
	})
	expect(await openPayload(openedKey, record)).toMatchObject({
		secret: "stored-secret"
	})
	wipe(opened.masterKey)
}, 120_000)
