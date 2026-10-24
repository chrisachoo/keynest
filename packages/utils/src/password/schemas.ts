import * as v from "valibot"

import {
	CHARACTER_SET_KEYS,
	MEMORABLE_PASSWORD_LIMITS,
	PASSWORD_SEPARATORS,
	RANDOM_PASSWORD_LIMITS
} from "./constants"

export const RandomPasswordOptionsSchema = v.pipe(
	v.object({
		length: v.pipe(
			v.number(),
			v.integer(),
			v.minValue(RANDOM_PASSWORD_LIMITS.minLength),
			v.maxValue(RANDOM_PASSWORD_LIMITS.maxLength)
		),
		uppercase: v.boolean(),
		lowercase: v.boolean(),
		numbers: v.boolean(),
		symbols: v.boolean(),
		excludeAmbiguous: v.boolean()
	}),
	v.check(
		(options) => CHARACTER_SET_KEYS.some((key) => options[key]),
		"Select at least one character set"
	)
)

export const MemorablePasswordOptionsSchema = v.object({
	wordCount: v.pipe(
		v.number(),
		v.integer(),
		v.minValue(MEMORABLE_PASSWORD_LIMITS.minWords),
		v.maxValue(MEMORABLE_PASSWORD_LIMITS.maxWords)
	),
	capitalize: v.boolean(),
	numbers: v.boolean(),
	separator: v.picklist(PASSWORD_SEPARATORS)
})

export const PasswordModeSchema = v.picklist(["random", "memorable"] as const)

export type RandomPasswordOptions = v.InferOutput<
	typeof RandomPasswordOptionsSchema
>
export type MemorablePasswordOptions = v.InferOutput<
	typeof MemorablePasswordOptionsSchema
>
export type PasswordMode = v.InferOutput<typeof PasswordModeSchema>
