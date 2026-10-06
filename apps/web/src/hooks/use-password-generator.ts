import {
	crackTimeLabel,
	DEFAULT_MEMORABLE_PASSWORD_OPTIONS,
	DEFAULT_RANDOM_PASSWORD_OPTIONS,
	generatePassword,
	ratePasswordStrength,
	type MemorablePasswordOptions,
	type PasswordMode,
	type RandomPasswordOptions
} from "@keynest/utils"
import { useState } from "react"

export function usePasswordGenerator() {
	const [mode, setMode] = useState<PasswordMode>("random")
	const [randomOptions, setRandomOptions] = useState<RandomPasswordOptions>(
		DEFAULT_RANDOM_PASSWORD_OPTIONS
	)
	const [memorableOptions, setMemorableOptions] =
		useState<MemorablePasswordOptions>(DEFAULT_MEMORABLE_PASSWORD_OPTIONS)
	const [generated, setGenerated] = useState(() =>
		generatePassword(
			"random",
			DEFAULT_RANDOM_PASSWORD_OPTIONS,
			DEFAULT_MEMORABLE_PASSWORD_OPTIONS
		)
	)

	return {
		mode,
		randomOptions,
		memorableOptions,
		password: generated.password,
		message: generated.message,
		crackTime: crackTimeLabel(generated.entropyBits),
		...ratePasswordStrength(generated.entropyBits),

		selectMode(nextMode: PasswordMode) {
			setMode(nextMode)
			setGenerated(generatePassword(nextMode, randomOptions, memorableOptions))
		},
		regeneratePassword() {
			setGenerated(generatePassword(mode, randomOptions, memorableOptions))
		},
		changeRandomOption<K extends keyof RandomPasswordOptions>(
			key: K,
			value: RandomPasswordOptions[K]
		) {
			const next = { ...randomOptions, [key]: value }
			setRandomOptions(next)
			setGenerated(generatePassword("random", next, memorableOptions))
		},
		changeMemorableOption<K extends keyof MemorablePasswordOptions>(
			key: K,
			value: MemorablePasswordOptions[K]
		) {
			const next = { ...memorableOptions, [key]: value }
			setMemorableOptions(next)
			setGenerated(generatePassword("memorable", randomOptions, next))
		}
	}
}
