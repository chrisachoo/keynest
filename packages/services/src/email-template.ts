export type TransactionalEmail = {
	html: string
	subject: string
	text: string
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
}

// Hex values of the light and sunset themes in apps/web/src/app.css.
const light = {
	card: "#ffffff",
	content: "#18181b",
	line: "#eeeeee",
	muted: "#5d5d5f",
	page: "#f8f8f8",
	primary: "#422ad5",
	primaryContent: "#e0e7ff"
} as const

const sunset = {
	card: "#121c22",
	content: "#9fb9d0",
	line: "#091319",
	muted: "#758a9c",
	page: "#0e171e",
	primary: "#00baa6",
	primaryContent: "#160603"
} as const

const ASSURANCE = "Your credentials. Your control."

function siteOrigin(value: string) {
	return new URL(value).origin
}

function layout(options: {
	body: string
	note: string
	origin: string
	preheader: string
	title: string
}) {
	const preheader = escapeHtml(options.preheader)
	const title = escapeHtml(options.title)
	const origin = escapeHtml(options.origin)
	const logo = escapeHtml(`${options.origin}/email-mark.svg`)

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${title}</title>
<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .bg-page { background-color: ${sunset.page} !important; }
  .bg-card { background-color: ${sunset.card} !important; border-color: ${sunset.line} !important; }
  .text-body { color: ${sunset.content} !important; }
  .text-muted { color: ${sunset.muted} !important; }
  .text-link, .text-link a { color: ${sunset.primary} !important; }
  .bg-button { background-color: ${sunset.primary} !important; }
  .text-button { color: ${sunset.primaryContent} !important; }
}
[data-ogsb] .bg-page, [data-ogsb].bg-page { background-color: ${sunset.page} !important; }
[data-ogsb] .bg-card, [data-ogsb].bg-card { background-color: ${sunset.card} !important; border-color: ${sunset.line} !important; }
[data-ogsb] .bg-button, [data-ogsb].bg-button { background-color: ${sunset.primary} !important; }
[data-ogsc] .text-body, [data-ogsc].text-body { color: ${sunset.content} !important; }
[data-ogsc] .text-muted, [data-ogsc].text-muted { color: ${sunset.muted} !important; }
[data-ogsc] .text-link, [data-ogsc].text-link { color: ${sunset.primary} !important; }
[data-ogsc] .text-button, [data-ogsc].text-button { color: ${sunset.primaryContent} !important; }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${light.page};color:${light.content};color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
<table role="presentation" class="bg-page" bgcolor="${light.page}" width="100%" cellspacing="0" cellpadding="0" style="background-color:${light.page};padding:32px 16px;">
<tr>
<td align="center">
<table role="presentation" class="bg-card" bgcolor="${light.card}" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:${light.card};border-radius:16px;overflow:hidden;border:1px solid ${light.line};">
<tr>
<td style="padding:28px 32px 8px;text-align:center;">
<a href="${origin}" style="text-decoration:none;">
<img src="${logo}" width="48" height="48" alt="Keynest" style="display:block;margin:0 auto 12px;border:0;border-radius:12px;outline:none;" />
<span class="text-body" style="color:${light.content};font-size:22px;font-weight:600;letter-spacing:-0.02em;">Keynest</span>
</a>
<p class="text-link" style="margin:8px 0 0;color:${light.primary};font-size:13px;line-height:1.4;">${ASSURANCE}</p>
</td>
</tr>
<tr>
<td class="text-body" style="padding:24px 32px 32px;color:${light.content};font-size:16px;line-height:1.6;">
${options.body}
</td>
</tr>
<tr>
<td class="text-muted" style="padding:0 32px 28px;color:${light.muted};font-size:13px;line-height:1.5;">
${options.note}
<p class="text-muted" style="margin:16px 0 0;color:${light.muted};">Keynest · <a class="text-link" href="${origin}" style="color:${light.primary};">${origin}</a></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`
}

function button(href: string, label: string) {
	const url = escapeHtml(href)
	const text = escapeHtml(label)
	return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
<tr>
<td class="bg-button" align="center" bgcolor="${light.primary}" style="border-radius:10px;background-color:${light.primary};">
<a class="text-button" href="${url}" style="display:inline-block;padding:14px 28px;color:${light.primaryContent};font-size:16px;font-weight:600;text-decoration:none;border-radius:10px;">${text}</a>
</td>
</tr>
</table>
<p class="text-muted" style="margin:0;font-size:14px;color:${light.muted};">Or copy this link into your browser:</p>
<p class="text-muted" style="margin:8px 0 0;font-size:14px;color:${light.muted};word-break:break-all;"><a class="text-link" href="${url}" style="color:${light.primary};">${url}</a></p>`
}

export function signupConfirmationEmail(
	confirmUrl: string
): TransactionalEmail {
	const origin = siteOrigin(confirmUrl)
	const subject = "Confirm your Keynest email"
	const text = [
		"Confirm this email for Keynest:",
		confirmUrl,
		"",
		"This link expires in 24 hours.",
		"",
		"Confirming your email does not open your vault. Sign in with your master password to unlock it.",
		"If you did not create a Keynest account, ignore this message.",
		"",
		`Keynest — ${ASSURANCE}`,
		origin
	].join("\n")

	const body = `<h1 class="text-body" style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${light.content};">Confirm your email</h1>
<p style="margin:0 0 8px;">Thanks for signing up. Confirm this address to finish creating your account.</p>
${button(confirmUrl, "Confirm email")}
<p class="text-muted" style="margin:0;font-size:14px;color:${light.muted};">This link expires in 24 hours.</p>`

	return {
		html: layout({
			body,
			note: `<p style="margin:0;">Confirming your email does not open your vault. Sign in with your master password to unlock it.</p>
<p style="margin:16px 0 0;">If you did not create a Keynest account, you can ignore this message.</p>`,
			origin,
			preheader: "Confirm your Keynest email address.",
			title: subject
		}),
		subject,
		text
	}
}

export function signupExistingEmail(origin: string): TransactionalEmail {
	const home = siteOrigin(origin)
	const loginUrl = `${home}/login`
	const subject = "Keynest sign-in"
	const text = [
		"A Keynest account already uses this email.",
		"Sign in with your password:",
		loginUrl,
		"",
		"If you did not try to create an account, ignore this message.",
		"",
		`Keynest — ${ASSURANCE}`,
		home
	].join("\n")

	const body = `<h1 class="text-body" style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${light.content};">Sign in to your account</h1>
<p style="margin:0 0 8px;">Someone tried to create a Keynest account with this email address. An account already exists here.</p>
<p style="margin:0 0 8px;">Sign in with your master password. Creating another account is not required.</p>
${button(loginUrl, "Go to sign in")}`

	return {
		html: layout({
			body,
			note: `<p style="margin:0;">If you did not try to create an account, you can ignore this message.</p>`,
			origin: home,
			preheader: "A sign-up attempt used your Keynest email.",
			title: subject
		}),
		subject,
		text
	}
}

export function emailChangeConfirmationEmail(
	email: string,
	confirmUrl: string
): TransactionalEmail {
	const origin = siteOrigin(confirmUrl)
	const subject = "Confirm your new Keynest email"
	const safeEmail = escapeHtml(email)
	const text = [
		`Confirm ${email} for your Keynest account:`,
		confirmUrl,
		"",
		"This link expires in 24 hours.",
		"",
		"Confirming your email does not open your vault. Sign in with your master password to unlock it.",
		"If you did not ask for this change, ignore this message.",
		"",
		`Keynest — ${ASSURANCE}`,
		origin
	].join("\n")

	const body = `<h1 class="text-body" style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${light.content};">Confirm your new email</h1>
<p style="margin:0 0 8px;">Confirm <strong>${safeEmail}</strong> for your Keynest account.</p>
${button(confirmUrl, "Confirm new email")}
<p class="text-muted" style="margin:0;font-size:14px;color:${light.muted};">This link expires in 24 hours.</p>`

	return {
		html: layout({
			body,
			note: `<p style="margin:0;">Confirming your email does not open your vault. Sign in with your master password to unlock it.</p>
<p style="margin:16px 0 0;">If you did not ask for this change, you can ignore this message.</p>`,
			origin,
			preheader: "Confirm your new Keynest email address.",
			title: subject
		}),
		subject,
		text
	}
}
