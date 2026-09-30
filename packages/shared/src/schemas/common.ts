import * as v from "valibot"

export const id = v.pipe(v.string(), v.minLength(1))

export const isoDateTime = v.pipe(v.string(), v.isoTimestamp())

export const apiError = v.object({
	message: v.string()
})

export type ApiError = v.InferOutput<typeof apiError>
