import * as v from "valibot"

const EmailSchema = v.pipe(
	v.string(),
	v.nonEmpty("Email is required."),
	v.email("The email is badly formatted.")
)

export const PasswordSchema = v.pipe(
	v.string(),
	v.minLength(8),
	v.maxLength(128),
	v.nonEmpty("Password is required.")
)
export const NameSchema = v.pipe(
	v.string(),
	v.minLength(2),
	v.maxLength(80),
	v.nonEmpty("Please enter your name.")
)

export const SignupSchema = v.object({
	email: EmailSchema,
	name: NameSchema,
	password: PasswordSchema
})

export const LoginSchema = v.object({
	email: EmailSchema,
	password: PasswordSchema
})

export type SignupInput = v.InferOutput<typeof SignupSchema>
export type LoginInput = v.InferOutput<typeof LoginSchema>
