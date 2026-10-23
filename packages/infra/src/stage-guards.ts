import * as Config from "effect/Config"
import * as Effect from "effect/Effect"

import {
	PRODUCTION_ORIGIN,
	PRODUCTION_STAGE,
	STAGING_ORIGIN,
	STAGING_STAGE
} from "./constants"

export function validateStageDeploy(stage: string) {
	return Effect.gen(function* () {
		if (stage === PRODUCTION_STAGE) {
			const emailFrom = yield* Config.String("EMAIL_FROM").pipe(
				Config.withDefault("")
			)
			const resendKey = yield* Config.String("RESEND_API_KEY").pipe(
				Config.withDefault("")
			)
			const origin = yield* Config.String("CORS_ORIGIN")
			if (!emailFrom || !resendKey) {
				return yield* Effect.die(
					new Error(
						"Production requires EMAIL_FROM and RESEND_API_KEY so signup can confirm an address."
					)
				)
			}
			if (origin !== PRODUCTION_ORIGIN) {
				return yield* Effect.die(
					new Error(`Production CORS_ORIGIN must be ${PRODUCTION_ORIGIN}.`)
				)
			}
		}

		if (stage === STAGING_STAGE) {
			const origin = yield* Config.String("CORS_ORIGIN")
			if (origin !== STAGING_ORIGIN) {
				return yield* Effect.die(
					new Error(`Staging CORS_ORIGIN must be ${STAGING_ORIGIN}.`)
				)
			}
		}
	})
}
