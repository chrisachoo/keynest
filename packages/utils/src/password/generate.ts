import * as v from "valibot"

import {
	AMBIGUOUS_CHARACTERS,
	CHARACTER_SET_KEYS,
	CHARACTER_SETS,
	METER_FULL_AT_BITS,
	OFFLINE_GUESSES_PER_SECOND,
	STRENGTH_LEVELS
} from "./constants"
import {
	MemorablePasswordOptionsSchema,
	RandomPasswordOptionsSchema,
	type MemorablePasswordOptions,
	type PasswordMode,
	type RandomPasswordOptions
} from "./schemas"
import { WORD_LIST } from "./word-list"

export type GeneratedPassword = {
	password: string
	entropyBits: number
	message: string | null
}

const randomBuffer = new Uint32Array(256)
let randomCursor = randomBuffer.length

const poolCache = new Map<string, readonly string[]>()

function nextUint32() {
	if (randomCursor >= randomBuffer.length) {
		crypto.getRandomValues(randomBuffer)
		randomCursor = 0
	}

	const value = randomBuffer[randomCursor]
	randomCursor += 1
	return value ?? 0
}

/** Unbiased integer in [0, maxExclusive). */
function randomInt(maxExclusive: number) {
	if (maxExclusive <= 1) return 0

	const limit = Math.floor(2 ** 32 / maxExclusive) * maxExclusive
	let value = nextUint32()

	while (value >= limit) value = nextUint32()

	return value % maxExclusive
}

function shuffle(values: string[]) {
	for (let index = values.length - 1; index > 0; index -= 1) {
		const swapIndex = randomInt(index + 1)
		const current = values[index] ?? ""
		values[index] = values[swapIndex] ?? current
		values[swapIndex] = current
	}

	return values
}

function selectedSets(options: RandomPasswordOptions) {
	const key =
		CHARACTER_SET_KEYS.map((name) => (options[name] ? "1" : "0")).join("") +
		(options.excludeAmbiguous ? "1" : "0")
	const cached = poolCache.get(key)
	if (cached) return cached

	const ambiguous = new Set(AMBIGUOUS_CHARACTERS)
	const sets = CHARACTER_SET_KEYS.flatMap((name) => {
		if (!options[name]) return []

		const characters = options.excludeAmbiguous
			? [...CHARACTER_SETS[name]]
					.filter((character) => !ambiguous.has(character))
					.join("")
			: CHARACTER_SETS[name]

		return characters ? [characters] : []
	})

	poolCache.set(key, sets)
	return sets
}

function failure(message: string): GeneratedPassword {
	return { password: "", entropyBits: 0, message }
}

function firstIssue(issues: readonly { message: string }[], fallback: string) {
	return issues[0]?.message ?? fallback
}

export function generateRandomPassword(
	options: RandomPasswordOptions
): GeneratedPassword {
	const parsed = v.safeParse(RandomPasswordOptionsSchema, options)
	if (!parsed.success) {
		return failure(
			firstIssue(parsed.issues, "Select at least one character set")
		)
	}

	const sets = selectedSets(parsed.output)
	const pool = sets.join("")

	if (!pool || parsed.output.length < sets.length) {
		return failure("Select at least one character set")
	}

	const characters = sets.map((set) => set.charAt(randomInt(set.length)))

	while (characters.length < parsed.output.length) {
		characters.push(pool.charAt(randomInt(pool.length)))
	}

	return {
		password: shuffle(characters).join(""),
		entropyBits: parsed.output.length * Math.log2(pool.length),
		message: null
	}
}

function capitalizeWord(word: string) {
	return word.charAt(0).toUpperCase() + word.slice(1)
}

export function generateMemorablePassword(
	options: MemorablePasswordOptions
): GeneratedPassword {
	const parsed = v.safeParse(MemorablePasswordOptionsSchema, options)
	if (!parsed.success) {
		return failure(firstIssue(parsed.issues, "Enter a valid passphrase"))
	}

	if (WORD_LIST.length === 0) return failure("Word list is empty")

	const words = Array.from({ length: parsed.output.wordCount }, () => {
		const word = WORD_LIST[randomInt(WORD_LIST.length)] ?? ""
		return parsed.output.capitalize ? capitalizeWord(word) : word
	})
	const digits = parsed.output.numbers ? `${randomInt(10)}${randomInt(10)}` : ""
	const entropyBits =
		parsed.output.wordCount * Math.log2(WORD_LIST.length) +
		(parsed.output.numbers ? Math.log2(100) : 0)

	return {
		password: [...words, digits].filter(Boolean).join(parsed.output.separator),
		entropyBits,
		message: null
	}
}

export function generatePassword(
	mode: PasswordMode,
	randomOptions: RandomPasswordOptions,
	memorableOptions: MemorablePasswordOptions
) {
	return mode === "random"
		? generateRandomPassword(randomOptions)
		: generateMemorablePassword(memorableOptions)
}

export function ratePasswordStrength(entropyBits: number) {
	const first = STRENGTH_LEVELS[0]
	if (!first)
		return {
			strength: "weak",
			meter: "progress-error",
			text: "text-error",
			value: 0
		}

	let level: (typeof STRENGTH_LEVELS)[number] = first

	for (const entry of STRENGTH_LEVELS) {
		if (entropyBits >= entry.minBits) level = entry
	}

	return {
		strength: level.label,
		meter: level.meter,
		text: level.text,
		value: Math.min(100, Math.round((entropyBits / METER_FULL_AT_BITS) * 100))
	}
}

export function crackTimeLabel(entropyBits: number) {
	if (entropyBits <= 0) return "Choose at least one character set"

	const log10Seconds =
		entropyBits * Math.log10(2) - Math.log10(OFFLINE_GUESSES_PER_SECOND)
	const minute = Math.log10(60)
	const hour = Math.log10(60 * 60)
	const day = Math.log10(60 * 60 * 24)
	const year = Math.log10(60 * 60 * 24 * 365)
	const thousandYears = year + 3
	const millionYears = year + 6

	if (log10Seconds < 0) return "Less than a second to crack this password"
	if (log10Seconds < minute) return "Seconds to crack this password"
	if (log10Seconds < hour) return "Minutes to crack this password"
	if (log10Seconds < day) return "Hours to crack this password"
	if (log10Seconds < year) return "Days to crack this password"
	if (log10Seconds < thousandYears) return "Years to crack this password"
	if (log10Seconds < millionYears) {
		return "Thousands of years to crack this password"
	}

	return "Millions of years to crack this password"
}
