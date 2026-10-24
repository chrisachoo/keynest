export class MailDeliveryError extends Error {}

export type MailEnv = {
	EMAIL_FROM?: string
	RESEND_API_KEY?: string
}

export function mailConfigured(env: MailEnv) {
	return Boolean(env.EMAIL_FROM && env.RESEND_API_KEY)
}

export function isLocalRequest(url: string) {
	const host = new URL(url).hostname
	return host === "localhost" || host === "127.0.0.1"
}

export async function sendMail(
	env: MailEnv,
	message: { subject: string; text: string; to: string },
	dev: boolean
) {
	if (env.EMAIL_FROM && env.RESEND_API_KEY) {
		const response = await fetch("https://api.resend.com/emails", {
			body: JSON.stringify({
				from: env.EMAIL_FROM,
				subject: message.subject,
				text: message.text,
				to: message.to
			}),
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				"Content-Type": "application/json"
			},
			method: "POST"
		})
		if (!response.ok) throw new MailDeliveryError("Could not send email")
		return
	}

	if (dev) return
	throw new MailDeliveryError("Email delivery is not configured.")
}
