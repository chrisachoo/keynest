export function securityHeaders(apiOrigin: string) {
	const policy = [
		"default-src 'self'",
		"script-src 'self' 'wasm-unsafe-eval'",
		"style-src 'self'",
		"style-src-attr 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		`connect-src 'self' ${apiOrigin}`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'"
	].join("; ")

	return [
		"/*",
		`  Content-Security-Policy: ${policy}`,
		"  Cross-Origin-Opener-Policy: same-origin",
		"  Referrer-Policy: no-referrer",
		"  Strict-Transport-Security: max-age=15552000; includeSubDomains",
		"  X-Content-Type-Options: nosniff",
		"  X-Frame-Options: DENY",
		"  Permissions-Policy: camera=(), microphone=(), geolocation=()"
	].join("\n")
}
