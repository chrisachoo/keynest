export function securityHeaders(apiOrigin: string) {
	const policy = [
		"default-src 'self'",
		"script-src 'self' 'wasm-unsafe-eval' https://accounts.google.com/gsi/client",
		"style-src 'self' https://accounts.google.com/gsi/style",
		"style-src-attr 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		`connect-src 'self' ${apiOrigin} https://accounts.google.com/gsi/`,
		"frame-src https://accounts.google.com/gsi/",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'"
	].join("; ")

	return [
		"/*",
		`  Content-Security-Policy: ${policy}`,
		"  Cross-Origin-Opener-Policy: same-origin-allow-popups",
		"  Referrer-Policy: no-referrer",
		"  Strict-Transport-Security: max-age=15552000; includeSubDomains",
		"  X-Content-Type-Options: nosniff",
		"  X-Frame-Options: DENY",
		"  Permissions-Policy: camera=(), microphone=(), geolocation=()"
	].join("\n")
}
