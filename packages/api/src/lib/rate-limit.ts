import type { Context } from "hono"

import type { ApiEnv } from "../env"
import { tooManyRequests } from "./http"

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
