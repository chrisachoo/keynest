import * as v from "valibot"

export const userPublic = v.object({
	email: v.pipe(v.string(), v.email()),
	emailVerified: v.boolean(),
	id: v.string(),
	image: v.nullable(v.string()),
	name: v.string()
})

export type UserPublic = v.InferOutput<typeof userPublic>
