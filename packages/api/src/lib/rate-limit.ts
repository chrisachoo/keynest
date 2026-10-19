import type { Context } from "hono"
import { createMiddleware } from "hono/factory"

import type { ApiEnv } from "../env"
import { tooManyRequests, unauthorized } from "./http"

async function consume(limiter: RateLimit, key: string) {
	const { success } = await limiter.limit({ key })
	if (!success) throw tooManyRequests()
}

export async function enforceAuthIp(c: Context<ApiEnv>) {
	const ip = c.req.header("cf-connecting-ip") || "unknown"
	await consume(c.env.AUTH_IP, `auth:${ip}`)
}

export async function enforceAuthAccount(c: Context<ApiEnv>, email: string) {
	await consume(c.env.AUTH_ACCOUNT, `acct:${email.trim().toLowerCase()}`)
}

export async function enforceErrorIp(c: Context<ApiEnv>) {
	const ip = c.req.header("cf-connecting-ip") || "unknown"
	await consume(c.env.AUTH_IP, `error:${ip}`)
}

export const limitAuthSession = createMiddleware<ApiEnv>(async (c, next) => {
	const user = c.get("user")
	if (!user) throw unauthorized()
	await consume(c.env.AUTH_SESSION, `user:${user.id}`)
	await next()
})
