/** Canonical form for lookups and storage. Providers and user input may vary in case. */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase()
}
