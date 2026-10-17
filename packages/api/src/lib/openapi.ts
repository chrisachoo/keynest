import { ApiErrorSchema } from "@keynest/shared"
import { resolver } from "hono-openapi"
import type { GenericSchema } from "valibot"

type JsonContentResponse = {
	content: {
		"application/json": {
			schema: ReturnType<typeof resolver>
		}
	}
	description: string
}

export function jsonContent(
	schema: GenericSchema,
	description: string
): JsonContentResponse {
	return {
		content: {
			"application/json": {
				schema: resolver(schema)
			}
		},
		description
	}
}

export const UNAUTHORIZED_RESPONSE: JsonContentResponse = jsonContent(
	ApiErrorSchema,
	"Unauthorized"
)

export const INVALID_CREDENTIALS_RESPONSE: JsonContentResponse = jsonContent(
	ApiErrorSchema,
	"Invalid email or password"
)

export const NOT_FOUND_RESPONSE: JsonContentResponse = jsonContent(
	ApiErrorSchema,
	"Not found"
)

export const CONFLICT_RESPONSE: JsonContentResponse = jsonContent(
	ApiErrorSchema,
	"Conflict"
)

export const INTERNAL_SERVER_ERROR: JsonContentResponse = jsonContent(
	ApiErrorSchema,
	"Internal server error"
)

export const TOO_MANY_REQUESTS: JsonContentResponse = jsonContent(
	ApiErrorSchema,
	"Too many requests"
)
