import { createEnv } from "@t3-oss/env-core"
import * as v from "valibot"

export const env = createEnv({
	client: {
		VITE_SERVER_URL: v.pipe(v.string(), v.url())
	},
	clientPrefix: "VITE_",
	emptyStringAsUndefined: true,
	runtimeEnv: import.meta.env
})
