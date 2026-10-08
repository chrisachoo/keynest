import * as v from "valibot"

import { isoDateTime } from "./common"

export const UserPublicSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	emailVerified: v.boolean(),
	id: v.string(),
	image: v.nullable(v.string()),
	name: v.string(),
	vaultSalt: v.pipe(v.string(), v.minLength(1))
})

export const AuthSessionSchema = v.object({
	...UserPublicSchema.entries,
	sessionExpiresAt: isoDateTime
})

export type UserPublicSchema = v.InferOutput<typeof UserPublicSchema>
export type AuthSession = v.InferOutput<typeof AuthSessionSchema>
