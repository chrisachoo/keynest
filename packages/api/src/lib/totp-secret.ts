import { openString, sealString } from "./secret-box"

export function sealTotpSecret(plaintext: string, totpKey: string) {
	return sealString(plaintext, totpKey)
}

export function openTotpSecret(packed: string, totpKey: string) {
	return openString(packed, totpKey)
}
