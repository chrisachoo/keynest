import { expect, test } from "bun:test"

import { accountDeletedEmail } from "./email-template"

test("account deleted email names the account and says it cannot be restored", () => {
	const message = accountDeletedEmail({
		deletedAt: new Date("2026-11-17T20:20:00.000Z"),
		email: "ada@example.com",
		name: "Ada <script>",
		origin: "https://keynest.me/app"
	})

	expect(message.subject).toBe("Your Keynest account was deleted")
	expect(message.text).toContain("Ada <script>")
	expect(message.text).toContain("ada@example.com")
	expect(message.text).toContain("17 November 2026")
	expect(message.text).toContain("20:20 UTC")
	expect(message.text).toContain("cannot restore")
	expect(message.text).toContain("https://keynest.me")
	expect(message.html).toContain("Ada &lt;script&gt;")
	expect(message.html).not.toContain("Ada <script>")
	expect(message.html).toContain(
		"Your Keynest account and encrypted vault were removed."
	)
})
