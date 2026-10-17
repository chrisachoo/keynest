import { ADJECTIVES, NOUNS } from "./names"

function pick<T>(items: readonly T[]): T {
	return items[randomIndex(items.length)]!
}

export function randomIndex(max: number) {
	const range = 2 ** 32
	const limit = range - (range % max)
	const values = new Uint32Array(1)
	let value = limit

	while (value >= limit) {
		crypto.getRandomValues(values)
		value = values[0]!
	}

	return value % max
}

export function generateUsername(includeNumber: boolean, separator: string) {
	const words: string[] = [pick(ADJECTIVES), pick(NOUNS)]

	if (includeNumber) {
		words.push(randomIndex(100).toString().padStart(2, "0"))
	}

	return words.join(separator)
}
