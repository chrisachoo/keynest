import { apiError } from "@keynest/shared"
import { resolver } from "hono-openapi"
import type { GenericSchema } from "valibot"

export function jsonContent(schema: GenericSchema, description: string) {
	return {
		content: {
			"application/json": {
				schema: resolver(schema)
			}
		},
		description
	}
}

export const unauthorizedResponse = jsonContent(apiError, "Unauthorized")
export const notFoundResponse = jsonContent(apiError, "Not found")
