import { HTTPException } from "hono/http-exception"

export function unauthorized(message = "Unauthorized") {
	return new HTTPException(401, { message })
}

export function invalidCredentials(message = "Invalid email or password") {
	return new HTTPException(401, { message })
}

export function forbidden(message = "Forbidden") {
	return new HTTPException(403, { message })
}

export function notFound(message = "Not found") {
	return new HTTPException(404, { message })
}

export function conflict(message = "Conflict") {
	return new HTTPException(409, { message })
}

export function internalError(message = "Internal server error") {
	return new HTTPException(500, { message })
}
