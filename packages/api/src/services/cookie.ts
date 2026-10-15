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
	const secure = new URL(c.req.url).protocol === "https:"
	return {
		httpOnly: true,
		maxAge: SESSION_TTL_SECONDS,
		path: "/",
		// HTTPS deployments can put the site and API on different hosts.
		// SameSite=None is only valid with Secure; local HTTP stays Lax.
		sameSite: secure ? ("None" as const) : ("Lax" as const),
		secure
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
