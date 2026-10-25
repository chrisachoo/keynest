import { createDb, notification, type Database } from "@keynest/db"
import {
	EMAIL_TOKEN_TTL_MS,
	SignupEventSchema,
	type SignupEvent
} from "@keynest/shared"
import * as v from "valibot"

import { signupConfirmationEmail, signupExistingEmail } from "./email-template"
import { sendMail, type MailEnv } from "./mail"
import { issueToken } from "./verification"

export class InvalidSignupEvent extends Error {
	constructor() {
		super("Signup event is invalid")
	}
}

type SignupWorkerEnv = MailEnv & {
	CORS_ORIGIN: string
	DB: D1Database
}

function verifyLink(origin: string, token: string) {
	return `${origin}/verify-email?token=${encodeURIComponent(token)}`
}

async function recordNotification(
	db: Database,
	messageId: string,
	userId: string,
	kind: "signup" | "signup_existing",
	title: string,
	body: string
) {
	await db
		.insert(notification)
		.values({ body, id: messageId, kind, title, userId })
		.onConflictDoNothing()
}

export async function enqueueUserSignedUp(
	queue: Queue<SignupEvent>,
	db: Database,
	userId: string,
	email: string
) {
	const token = await issueToken(
		db,
		`verify-email:${userId}`,
		EMAIL_TOKEN_TTL_MS
	)
	await queue.send(
		{ email, token, type: "user.signed_up", userId },
		{ contentType: "json" }
	)
}

export async function enqueueSignupExisting(
	queue: Queue<SignupEvent>,
	userId: string,
	email: string
) {
	await queue.send(
		{ email, type: "user.signup_existing", userId },
		{ contentType: "json" }
	)
}

export async function applySignupEvent(
	db: Database,
	env: MailEnv & { CORS_ORIGIN: string },
	event: SignupEvent,
	messageId: string
) {
	if (event.type === "user.signed_up") {
		await recordNotification(
			db,
			messageId,
			event.userId,
			"signup",
			"Confirm your email",
			"We sent a confirmation link. It expires in 24 hours."
		)
		const confirmation = signupConfirmationEmail(
			verifyLink(env.CORS_ORIGIN, event.token)
		)
		await sendMail(env, { ...confirmation, to: event.email }, false)
		return
	}

	await recordNotification(
		db,
		messageId,
		event.userId,
		"signup_existing",
		"Sign-in attempt",
		"Someone tried to create a Keynest account with your email. Sign in with your password."
	)
	const notice = signupExistingEmail(env.CORS_ORIGIN)
	await sendMail(env, { ...notice, to: event.email }, false)
}

export async function handleSignupEvent(
	env: SignupWorkerEnv,
	body: unknown,
	messageId: string
) {
	const parsed = v.safeParse(SignupEventSchema, body)
	if (!parsed.success) throw new InvalidSignupEvent()
	await applySignupEvent(createDb(env.DB), env, parsed.output, messageId)
}
