import * as v from "valibot"

import { EmailSchema } from "./auth"
import { IdSchema } from "./common"

export const UserSignedUpEventSchema = v.object({
	email: EmailSchema,
	token: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
	type: v.literal("user.signed_up"),
	userId: IdSchema
})

export const UserSignupExistingEventSchema = v.object({
	email: EmailSchema,
	type: v.literal("user.signup_existing"),
	userId: IdSchema
})

export const SignupEventSchema = v.variant("type", [
	UserSignedUpEventSchema,
	UserSignupExistingEventSchema
])

export type SignupEvent = v.InferOutput<typeof SignupEventSchema>
