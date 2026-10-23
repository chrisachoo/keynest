import { and, eq, isNull, recoveryCode, user } from "@keynest/db"
import type { Context } from "hono"

import type { ApiEnv } from "../env"
import { verifierMatches } from "../lib/password"
import { normalizeRecoveryCode, verifyTotp } from "../lib/totp"
import { openTotpSecret } from "../lib/totp-secret"

type UserRow = typeof user.$inferSelect

export async function confirmSecondFactor(
	c: Context<ApiEnv>,
	row: UserRow,
	code: string
) {
	if (!row.totpSecret) return false

	let secret: string
	try {
		secret = openTotpSecret(row.totpSecret, c.env.TOTP_ENCRYPTION_KEY)
	} catch {
		return false
	}

	if (verifyTotp(secret, code)) return true

	const normalized = normalizeRecoveryCode(code)
	if (normalized.length < 8) return false

	const codes = await c
		.get("db")
		.select()
		.from(recoveryCode)
		.where(and(eq(recoveryCode.userId, row.id), isNull(recoveryCode.usedAt)))

	const match = codes.find((item) => verifierMatches(normalized, item.codeHash))
	if (!match) return false

	await c
		.get("db")
		.update(recoveryCode)
		.set({ usedAt: new Date() })
		.where(eq(recoveryCode.id, match.id))
	return true
}
