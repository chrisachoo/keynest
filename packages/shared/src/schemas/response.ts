import * as v from "valibot"

export const ClientError = {
	badRequest: 400,
	unauthorized: 401,
	forbidden: 403,
	notFound: 404,
	methodNotAllowed: 405,
	conflict: 409,
	gone: 410,
	unprocessableEntity: 422,
	tooManyRequests: 429
} as const

export const ServerError = {
	internalServerError: 500,
	notImplemented: 501,
	badGateway: 502,
	serviceUnavailable: 503,
	gatewayTimeout: 504
} as const

export const ClientErrorSchema = v.picklist(Object.values(ClientError))
export const ServerErrorSchema = v.picklist(Object.values(ServerError))

export type ClientError = v.InferOutput<typeof ClientErrorSchema>
export type ServerError = v.InferOutput<typeof ServerErrorSchema>
