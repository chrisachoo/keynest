import * as v from "valibot"

import { IdSchema, IsoDateTimeSchema } from "./common"

export const NotificationSchema = v.object({
	body: v.string(),
	createdAt: IsoDateTimeSchema,
	id: IdSchema,
	kind: v.picklist(["signup", "signup_existing"]),
	title: v.string()
})

export const NotificationListSchema = v.object({
	notifications: v.array(NotificationSchema)
})

export type Notification = v.InferOutput<typeof NotificationSchema>
