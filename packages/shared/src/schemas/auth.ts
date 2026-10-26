import * as v from "valibot"

import { IdSchema, IsoDateTimeSchema } from "./common"

export const SocialProviderSchema = v.picklist([
	"discord",
	"github",
	"google",
	"microsoft"
])
export const NullableSocialProviderSchema = v.nullable(SocialProviderSchema)

export const EmailSchema = v.pipe(
	v.string(),
	v.nonEmpty("Email is required."),
	v.email("The email is badly formatted.")
)

export const PasswordSchema = v.pipe(
	v.string(),
	v.minLength(12, "Use at least 12 characters."),
	v.maxLength(128),
	v.nonEmpty("Password is required.")
)
export const NameSchema = v.pipe(
	v.string(),
	v.minLength(2),
	v.maxLength(80),
	v.nonEmpty("Please enter your name.")
)

export const NameFieldSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1),
	v.maxLength(120)
)

export const SecretFieldSchema = v.pipe(
	v.string(),
	v.minLength(1),
	v.maxLength(8_000)
)

const SaltFieldSchema = v.pipe(v.string(), v.minLength(22), v.maxLength(24))
const VerifierFieldSchema = v.pipe(v.string(), v.minLength(43), v.maxLength(44))
const SealedFieldSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(512))

export const KdfFields = {
	kdfIterations: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10)),
	kdfMemory: v.pipe(
		v.number(),
		v.integer(),
		v.minValue(8_192),
		v.maxValue(1_048_576)
	),
	kdfParallelism: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(4))
}

export const VaultWrapFields = {
	keyCheck: SealedFieldSchema,
	keyCheckNonce: SealedFieldSchema,
	vaultSalt: SaltFieldSchema,
	wrappedKey: SealedFieldSchema,
	wrappedKeyNonce: SealedFieldSchema
}

export const KdfParamsSchema = v.object({
	...KdfFields,
	vaultSalt: SaltFieldSchema
})

export const KdfRequestSchema = v.object({
	id: v.number(),
	params: KdfParamsSchema,
	password: v.string()
})

export const KdfResponseSchema = v.variant("ok", [
	v.object({
		error: v.string(),
		id: v.number(),
		ok: v.literal(false)
	}),
	v.object({
		hash: v.instance(Uint8Array),
		id: v.number(),
		ok: v.literal(true)
	})
])

export const VaultWrapSchema = v.object({
	...KdfFields,
	...VaultWrapFields
})

export const SignupFormSchema = v.object({
	email: EmailSchema,
	name: NameSchema,
	password: PasswordSchema
})

export const SignupInputSchema = v.object({
	email: EmailSchema,
	name: NameSchema,
	recoverySalt: SaltFieldSchema,
	recoveryVerifier: VerifierFieldSchema,
	recoveryWrappedKey: SealedFieldSchema,
	recoveryWrappedKeyNonce: SealedFieldSchema,
	verifier: VerifierFieldSchema,
	...VaultWrapFields
})

export const OAuthCompleteInputSchema = v.omit(SignupInputSchema, [
	"email",
	"name"
])

export const OAuthPendingProfileSchema = v.object({
	email: EmailSchema,
	name: NameSchema
})

export const LoginFormSchema = v.object({
	email: EmailSchema,
	password: PasswordSchema
})

export const LoginInputSchema = v.object({
	email: EmailSchema,
	verifier: VerifierFieldSchema
})

export const UnlockInputSchema = v.object({
	password: PasswordSchema
})

export const PreloginSchema = v.object({
	email: EmailSchema
})

export const PreloginResultSchema = v.object({
	...KdfFields,
	recoverySalt: SaltFieldSchema,
	recoveryWrappedKey: SealedFieldSchema,
	recoveryWrappedKeyNonce: SealedFieldSchema,
	vaultSalt: SaltFieldSchema
})

export const ChangePasswordInputSchema = v.object({
	newVerifier: VerifierFieldSchema,
	verifier: VerifierFieldSchema,
	...VaultWrapFields
})

export const RotateRecoveryInputSchema = v.object({
	recoverySalt: SaltFieldSchema,
	recoveryVerifier: VerifierFieldSchema,
	recoveryWrappedKey: SealedFieldSchema,
	recoveryWrappedKeyNonce: SealedFieldSchema,
	verifier: VerifierFieldSchema
})

export const ErrorReportInputSchema = v.object({
	message: v.pipe(v.string(), v.minLength(1), v.maxLength(500))
})

export const DeleteAccountInputSchema = v.object({
	verifier: VerifierFieldSchema
})

export const RecoverInputSchema = v.object({
	email: EmailSchema,
	recoveryVerifier: VerifierFieldSchema,
	verifier: VerifierFieldSchema,
	...VaultWrapFields
})

export const AcceptedSchema = v.object({
	status: v.literal("accepted")
})

export const EmailVerifiedSchema = v.object({
	verified: v.literal(true)
})

export const VerifyEmailSchema = v.object({
	token: v.pipe(v.string(), v.minLength(20), v.maxLength(200))
})

export const ResendVerificationSchema = v.object({
	email: EmailSchema
})

export const ChangeEmailInputSchema = v.object({
	email: EmailSchema,
	verifier: VerifierFieldSchema
})

export const TotpChallengeSchema = v.object({
	ticket: v.pipe(v.string(), v.minLength(20), v.maxLength(200)),
	totpRequired: v.literal(true)
})

export const TotpConfirmLoginInputSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(6), v.maxLength(44)),
	ticket: v.pipe(v.string(), v.minLength(20), v.maxLength(200))
})

export const TotpCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.length(6))
})

export const TotpSetupResultSchema = v.object({
	otpauthUrl: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
	secret: v.pipe(v.string(), v.minLength(16), v.maxLength(64))
})

export const RecoveryCodesResultSchema = v.object({
	recoveryCodes: v.array(v.pipe(v.string(), v.minLength(8)))
})

export const DisableTotpInputSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(6), v.maxLength(44)),
	verifier: VerifierFieldSchema
})

export const SessionInfoSchema = v.object({
	createdAt: IsoDateTimeSchema,
	current: v.boolean(),
	expiresAt: IsoDateTimeSchema,
	id: v.string(),
	ipAddress: v.nullable(v.string()),
	userAgent: v.nullable(v.string())
})

export const SessionListSchema = v.object({
	sessions: v.array(SessionInfoSchema)
})

export const SessionIdParamSchema = v.object({
	id: IdSchema
})

export type KdfParams = v.InferOutput<typeof KdfParamsSchema>
export type KdfRequest = v.InferOutput<typeof KdfRequestSchema>
export type KdfResponse = v.InferOutput<typeof KdfResponseSchema>
export type VaultWrap = v.InferOutput<typeof VaultWrapSchema>
export type SignupForm = v.InferOutput<typeof SignupFormSchema>
export type SignupInput = v.InferOutput<typeof SignupInputSchema>
export type OAuthCompleteInput = v.InferOutput<typeof OAuthCompleteInputSchema>
export type OAuthPendingProfile = v.InferOutput<
	typeof OAuthPendingProfileSchema
>
export type LoginForm = v.InferOutput<typeof LoginFormSchema>
export type LoginInput = v.InferOutput<typeof LoginInputSchema>
export type UnlockInput = v.InferOutput<typeof UnlockInputSchema>
export type PreloginResult = v.InferOutput<typeof PreloginResultSchema>
export type ChangePasswordInput = v.InferOutput<
	typeof ChangePasswordInputSchema
>
export type RotateRecoveryInput = v.InferOutput<
	typeof RotateRecoveryInputSchema
>
export type ErrorReportInput = v.InferOutput<typeof ErrorReportInputSchema>
export type DeleteAccountInput = v.InferOutput<typeof DeleteAccountInputSchema>
export type RecoverInput = v.InferOutput<typeof RecoverInputSchema>
export type Accepted = v.InferOutput<typeof AcceptedSchema>
export type ChangeEmailInput = v.InferOutput<typeof ChangeEmailInputSchema>
export type TotpChallenge = v.InferOutput<typeof TotpChallengeSchema>
export type TotpConfirmLoginInput = v.InferOutput<
	typeof TotpConfirmLoginInputSchema
>
export type DisableTotpInput = v.InferOutput<typeof DisableTotpInputSchema>
export type SessionInfo = v.InferOutput<typeof SessionInfoSchema>
export type SessionIdParam = v.InferOutput<typeof SessionIdParamSchema>
export type SocialProvider = v.InferOutput<typeof SocialProviderSchema>
export type NullableSocialProvider = v.InferOutput<
	typeof NullableSocialProviderSchema
>
