import * as v from "valibot"

import { isoDateTime } from "./common"

export const healthResponse = v.object({
	message: v.string(),
	ok: v.boolean(),
	timestamp: isoDateTime
})

export function disconnected<TSchema extends v.GenericSchema>(
	schema: TSchema,
	message: string
): v.InferOutput<TSchema> {
	return v.parse(schema, {
		message,
		ok: false,
		timestamp: new Date().toISOString()
	})
}

export type HealthResponse = v.InferOutput<typeof healthResponse>
