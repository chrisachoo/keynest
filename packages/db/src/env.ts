import { createEnv } from "@t3-oss/env-core"
import * as v from "valibot"

export function createDbEnv(runtimeEnv: { DATABASE_URL: string | undefined }) {
	return createEnv({
		emptyStringAsUndefined: true,
		runtimeEnv,
		server: {
			DATABASE_URL: v.optional(
				v.pipe(v.string(), v.minLength(1)),
				"file:./local.db"
			)
		}
	})
}

export const env = createDbEnv({
	DATABASE_URL: process.env.DATABASE_URL
})
