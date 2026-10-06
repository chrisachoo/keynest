export const CHARACTER_SETS = {
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	numbers: "0123456789",
	symbols: "!@#$%^&*()-_=+[]{};:,.?"
} as const

export const CHARACTER_SET_KEYS = [
	"uppercase",
	"lowercase",
	"numbers",
	"symbols"
] as const

export const AMBIGUOUS_CHARACTERS = "Il1O0o"

export const RANDOM_PASSWORD_LIMITS = {
	minLength: 8,
	maxLength: 64
} as const

export const MEMORABLE_PASSWORD_LIMITS = {
	minWords: 3,
	maxWords: 8
} as const

export const PASSWORD_SEPARATORS = ["-", "_", ".", "!", "@"] as const

export const SEPARATOR_EXAMPLE_WORDS = ["waffle", "eat", "waffle"] as const

export const PASSWORD_MODES = [
	{ id: "random", label: "Random" },
	{ id: "memorable", label: "Passphrase" }
] as const

export const METER_FULL_AT_BITS = 100

/** Assumed offline guessing speed for the crack-time sentence. */
export const OFFLINE_GUESSES_PER_SECOND = 10_000_000_000

export const STRENGTH_LEVELS = [
	{ label: "weak", minBits: 0, meter: "progress-error", text: "text-error" },
	{
		label: "vulnerable",
		minBits: 45,
		meter: "progress-warning",
		text: "text-warning"
	},
	{
		label: "strong",
		minBits: 70,
		meter: "progress-success",
		text: "text-success"
	}
] as const

export const DEFAULT_RANDOM_PASSWORD_OPTIONS = {
	length: 16,
	uppercase: true,
	lowercase: true,
	numbers: true,
	symbols: true,
	excludeAmbiguous: true
} as const

export const DEFAULT_MEMORABLE_PASSWORD_OPTIONS = {
	wordCount: 4,
	capitalize: true,
	numbers: true,
	separator: "-"
} as const
