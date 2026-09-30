import * as v from "valibot"

export const ThemeSchema = v.fallback(v.picklist(["light", "sunset"]), "light")

export const UIStateSchema = v.object({
	theme: ThemeSchema
})

export type Theme = v.InferOutput<typeof ThemeSchema>
export type UIState = v.InferOutput<typeof UIStateSchema>
