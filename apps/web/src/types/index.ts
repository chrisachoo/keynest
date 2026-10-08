import { isoDateTime, UserPublicSchema } from "@keynest/shared"
import * as v from "valibot"

export const AuthStateSchema = v.object({
	initialized: v.boolean("A boolean is required"),
	sessionExpiresAt: v.nullable(isoDateTime),
	user: v.nullable(UserPublicSchema)
})

export const ThemeSchema = v.fallback(v.picklist(["light", "sunset"]), "light")
export const UIStateSchema = v.object({
	theme: ThemeSchema
})

export type AuthState = v.InferOutput<typeof AuthStateSchema>
export type Theme = v.InferOutput<typeof ThemeSchema>
export type UIState = v.InferOutput<typeof UIStateSchema>
