import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@keynest/shared"
import type { Context } from "hono"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"

import type { ApiEnv } from "../env"
import { internalError } from "../lib/http"

function cookieSecret(c: Context<ApiEnv>): string {
	const secret = c.env.COOKIE_SECRET
	if (!secret || secret.length < 32)
		throw internalError("Cookie secret is not configured")

	return secret
}

function sessionCookieOptions(c: Context<ApiEnv>) {
	return {
		httpOnly: true,
		maxAge: SESSION_TTL_SECONDS,
		path: "/",
		sameSite: "Strict" as const,
		secure: new URL(c.req.url).protocol === "https:"
	}
}

export async function setSessionCookie(
	c: Context<ApiEnv>,
	token: string
): Promise<void> {
	await setSignedCookie(
		c,
		SESSION_COOKIE,
		token,
		cookieSecret(c),
		sessionCookieOptions(c)
	)
}

export async function readSessionCookie(
	c: Context<ApiEnv>
): Promise<string | null> {
	const value = await getSignedCookie(c, cookieSecret(c), SESSION_COOKIE)
	return typeof value === "string" ? value : null
}

export function clearSessionCookie(c: Context<ApiEnv>): void {
	deleteCookie(c, SESSION_COOKIE, sessionCookieOptions(c))
}
