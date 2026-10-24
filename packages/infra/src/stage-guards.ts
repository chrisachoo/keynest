import * as Config from "effect/Config"
import * as Effect from "effect/Effect"

import {
	PRODUCTION_ORIGIN,
	PRODUCTION_STAGE,
	STAGING_ORIGIN,
	STAGING_STAGE
} from "./constants"

const MIN_SECRET_LENGTH = 32

function assertSecretLength(name: string, value: string) {
	if (value.length < MIN_SECRET_LENGTH) {
		return Effect.die(
			new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters.`)
		)
	}
	return Effect.void
}

function requireDeploySecrets() {
	return Effect.gen(function* () {
		const cookie = yield* Config.String("COOKIE_SECRET")
		const totp = yield* Config.String("TOTP_ENCRYPTION_KEY")
		yield* assertSecretLength("COOKIE_SECRET", cookie)
		yield* assertSecretLength("TOTP_ENCRYPTION_KEY", totp)
	})
}

export function validateStageDeploy(stage: string) {
	return Effect.gen(function* () {
		if (stage === PRODUCTION_STAGE || stage === STAGING_STAGE) {
			yield* requireDeploySecrets()
		}

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
