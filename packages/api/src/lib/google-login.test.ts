import { expect, test } from "bun:test"

import {
	googleLoginIdentifier,
	parseGoogleLogin,
	parseTotpLogin,
	totpLoginIdentifier
} from "./user"

test("google login tickets round-trip the subject to link", () => {
	expect(parseGoogleLogin(googleLoginIdentifier("user_1", null))).toEqual({
		sub: null,
		userId: "user_1"
	})
	expect(
		parseGoogleLogin(googleLoginIdentifier("user_1", "sub:value"))
	).toEqual({ sub: "sub:value", userId: "user_1" })
	expect(parseGoogleLogin("totp-login:0:user_1")).toBeNull()
})

test("totp tickets keep a google subject across attempt changes", () => {
	expect(totpLoginIdentifier(0, "user_1", null)).toBe("totp-login:0:user_1")
	expect(parseTotpLogin("totp-login:0:user_1")).toEqual({
		attempts: 0,
		googleSub: null,
		userId: "user_1"
	})
	expect(parseTotpLogin(totpLoginIdentifier(2, "user_1", "sub:value"))).toEqual(
		{
			attempts: 2,
			googleSub: "sub:value",
			userId: "user_1"
		}
	)
})
