import { expect, test } from "bun:test"

import { recordError, redactErrorMessage } from "./report"

test("redactErrorMessage removes secrets and truncates", () => {
	const message = redactErrorMessage(
		"failed token=abc password=hunter2 bearer secret-token " +
			"verifier=abcdefghijklmnopqrstuvwxyz0123456789ABCD extra"
	)

	expect(message).not.toContain("hunter2")
	expect(message).not.toContain("secret-token")
	expect(message).not.toContain("abcdefghijklmnopqrstuvwxyz0123456789ABCD")
	expect(message.length).toBeLessThanOrEqual(300)
})

test("recordError stores the redacted message", async () => {
	const bound: unknown[][] = []
	const db = {
		prepare() {
			return {
				bind(...args: unknown[]) {
					bound.push(args)
					return { run: async () => ({}) }
				}
			}
		}
	} as unknown as D1Database

	await recordError(db, "server", "boom ?token=session-secret&password=hunter2")

	expect(bound).toHaveLength(1)
	const row = bound[0]
	expect(row?.[1]).toBe("server")
	expect(String(row?.[2])).not.toContain("session-secret")
	expect(String(row?.[2])).not.toContain("hunter2")
})
