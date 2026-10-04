import { apiError } from "@keynest/shared"
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
	apiError,
	"Unauthorized"
)

export const INVALID_CREDENTIALS_RESPONSE: JsonContentResponse = jsonContent(
	apiError,
	"Invalid email or password"
)

export const NOT_FOUND_RESPONSE: JsonContentResponse = jsonContent(
	apiError,
	"Not found"
)
