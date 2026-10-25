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

function layout(options: { body: string; preheader: string; title: string }) {
	const preheader = escapeHtml(options.preheader)
	const title = escapeHtml(options.title)

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef2f1;padding:32px 16px;">
<tr>
<td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8e3df;">
<tr>
<td style="background:linear-gradient(135deg,#00352f 0%,#001f1b 100%);padding:28px 32px;text-align:center;">
<span style="color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.02em;">Keynest</span>
</td>
</tr>
<tr>
<td style="padding:32px;color:#1a2421;font-size:16px;line-height:1.6;">
${options.body}
</td>
</tr>
<tr>
<td style="padding:0 32px 28px;color:#5c6b66;font-size:13px;line-height:1.5;">
<p style="margin:0;">Confirming your email does not open your vault. Sign in with your master password to unlock it.</p>
<p style="margin:16px 0 0;">If you did not request this, you can ignore this message.</p>
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
<td align="center" style="border-radius:10px;background-color:#19ae95;">
<a href="${url}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:10px;">${text}</a>
</td>
</tr>
</table>
<p style="margin:0;font-size:14px;color:#5c6b66;">Or copy this link into your browser:</p>
<p style="margin:8px 0 0;font-size:14px;word-break:break-all;"><a href="${url}" style="color:#139f89;">${url}</a></p>`
}

export function signupConfirmationEmail(
	confirmUrl: string
): TransactionalEmail {
	const subject = "Confirm your Keynest email"
	const text = [
		"Confirm this email for Keynest:",
		confirmUrl,
		"",
		"This link expires in 24 hours.",
		"",
		"Confirming your email does not open your vault. Sign in with your master password to unlock it.",
		"If you did not create a Keynest account, ignore this message."
	].join("\n")

	const body = `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#001f1b;">Confirm your email</h1>
<p style="margin:0 0 8px;">Thanks for signing up. Confirm this address to finish creating your account.</p>
${button(confirmUrl, "Confirm email")}
<p style="margin:0;font-size:14px;color:#5c6b66;">This link expires in 24 hours.</p>`

	return {
		html: layout({
			body,
			preheader: "Confirm your Keynest email address.",
			title: subject
		}),
		subject,
		text
	}
}

export function signupExistingEmail(origin: string): TransactionalEmail {
	const loginUrl = `${origin.replace(/\/$/, "")}/login`
	const subject = "Keynest sign-in"
	const text = [
		"A Keynest account already uses this email.",
		"Sign in with your password:",
		loginUrl,
		"",
		"If you did not try to create an account, ignore this message."
	].join("\n")

	const body = `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#001f1b;">Sign in to your account</h1>
<p style="margin:0 0 8px;">Someone tried to create a Keynest account with this email address. An account already exists here.</p>
<p style="margin:0 0 8px;">Sign in with your master password. Creating another account is not required.</p>
${button(loginUrl, "Go to sign in")}`

	return {
		html: layout({
			body,
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
	const subject = "Confirm your new Keynest email"
	const safeEmail = escapeHtml(email)
	const text = [
		`Confirm ${email} for your Keynest account:`,
		confirmUrl,
		"",
		"This link expires in 24 hours.",
		"",
		"Confirming your email does not open your vault. Sign in with your master password to unlock it.",
		"If you did not ask for this change, ignore this message."
	].join("\n")

	const body = `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#001f1b;">Confirm your new email</h1>
<p style="margin:0 0 8px;">Confirm <strong>${safeEmail}</strong> for your Keynest account.</p>
${button(confirmUrl, "Confirm new email")}
<p style="margin:0;font-size:14px;color:#5c6b66;">This link expires in 24 hours.</p>`

	return {
		html: layout({
			body,
			preheader: "Confirm your new Keynest email address.",
			title: subject
		}),
		subject,
		text
	}
}
