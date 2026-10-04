import * as v from "valibot"

const email = v.pipe(v.string(), v.email())
const password = v.pipe(v.string(), v.minLength(8), v.maxLength(128))

export const SignupSchema = v.object({
	email,
	name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
	password
})

export const LoginSchema = v.object({
	email,
	password
})

export type SignupInput = v.InferOutput<typeof SignupSchema>
export type LoginInput = v.InferOutput<typeof LoginSchema>
