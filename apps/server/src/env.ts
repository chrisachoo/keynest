import { createEnv } from "@t3-oss/env-core"
import * as v from "valibot"

export function createServerEnv(runtimeEnv: {
	CORS_ORIGIN: string | undefined
}) {
	return createEnv({
		emptyStringAsUndefined: true,
		runtimeEnv,
		server: {
			CORS_ORIGIN: v.pipe(v.string(), v.url())
		}
	})
}
