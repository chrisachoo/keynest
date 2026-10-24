import * as v from "valibot"

export const IdSchema = v.pipe(v.string(), v.minLength(1))

export const IsoDateTimeSchema = v.pipe(v.string(), v.isoTimestamp())

export const ApiErrorSchema = v.object({
	message: v.string()
})

export type Id = v.InferOutput<typeof IdSchema>
export type IsoDateTime = v.InferOutput<typeof IsoDateTimeSchema>
export type ApiError = v.InferOutput<typeof ApiErrorSchema>
