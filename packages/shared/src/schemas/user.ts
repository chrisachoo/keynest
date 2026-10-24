import * as v from "valibot"

import { KdfFields, VaultWrapFields } from "./auth"
import { IsoDateTimeSchema } from "./common"

export const UserPublicSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	emailVerified: v.boolean(),
	id: v.string(),
	image: v.nullable(v.string()),
	name: v.string(),
	totpEnabled: v.boolean(),
	...KdfFields,
	...VaultWrapFields
})

export const AuthSessionSchema = v.object({
	...UserPublicSchema.entries,
	sessionExpiresAt: IsoDateTimeSchema
})

export type UserPublic = v.InferOutput<typeof UserPublicSchema>
export type AuthSession = v.InferOutput<typeof AuthSessionSchema>
