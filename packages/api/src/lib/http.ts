import { HTTPException } from "hono/http-exception"

export function unauthorized(message = "Unauthorized") {
	return new HTTPException(401, { message })
}

export function notFound(message = "Not found") {
	return new HTTPException(404, { message })
}

export function internalError(message = "Internal server error") {
	return new HTTPException(500, { message })
}
