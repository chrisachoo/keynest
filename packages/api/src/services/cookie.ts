import {
	OAUTH_FLOW_TTL_SECONDS,
	OAUTH_PENDING_COOKIE,
	OAUTH_STATE_COOKIE,
	SESSION_COOKIE,
	SESSION_TTL_SECONDS
} from "@keynest/shared"
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

function sameSiteFor(hostname: string, secure: boolean) {
	if (!secure) return "Lax" as const
	if (hostname === "keynest.me" || hostname.endsWith(".keynest.me"))
		return "Lax" as const
	return "None" as const
}

function sessionCookieOptions(
	c: Context<ApiEnv>,
	maxAge = SESSION_TTL_SECONDS
) {
	const url = new URL(c.req.url)
	const secure = url.protocol === "https:"
	return {
		httpOnly: true,
		maxAge,
		path: "/",
		sameSite: sameSiteFor(url.hostname, secure),
		secure
	}
}

export async function setSessionCookie(
	c: Context<ApiEnv>,
	token: string,
	maxAge = SESSION_TTL_SECONDS
): Promise<void> {
	await setSignedCookie(
		c,
		SESSION_COOKIE,
		token,
		cookieSecret(c),
		sessionCookieOptions(c, maxAge)
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

export async function setOAuthPendingCookie(
	c: Context<ApiEnv>,
	value: string
): Promise<void> {
	await setSignedCookie(
		c,
		OAUTH_PENDING_COOKIE,
		value,
		cookieSecret(c),
		sessionCookieOptions(c, OAUTH_FLOW_TTL_SECONDS)
	)
}

export async function readOAuthPendingCookie(
	c: Context<ApiEnv>
): Promise<string | null> {
	const value = await getSignedCookie(c, cookieSecret(c), OAUTH_PENDING_COOKIE)
	return typeof value === "string" ? value : null
}

export function clearOAuthPendingCookie(c: Context<ApiEnv>): void {
	deleteCookie(c, OAUTH_PENDING_COOKIE, sessionCookieOptions(c))
}

export async function setOAuthStateCookie(
	c: Context<ApiEnv>,
	value: string
): Promise<void> {
	await setSignedCookie(
		c,
		OAUTH_STATE_COOKIE,
		value,
		cookieSecret(c),
		sessionCookieOptions(c, OAUTH_FLOW_TTL_SECONDS)
	)
}

export async function readOAuthStateCookie(
	c: Context<ApiEnv>
): Promise<string | null> {
	const value = await getSignedCookie(c, cookieSecret(c), OAUTH_STATE_COOKIE)
	return typeof value === "string" ? value : null
}

export function clearOAuthStateCookie(c: Context<ApiEnv>): void {
	deleteCookie(c, OAUTH_STATE_COOKIE, sessionCookieOptions(c))
}
