import {
	SocialProviderSchema,
	type NullableSocialProvider
} from "@keynest/shared"

export function socialProvider(value: string): NullableSocialProvider {
	return (
		SocialProviderSchema.options.find((provider) => provider === value) ?? null
	)
}
