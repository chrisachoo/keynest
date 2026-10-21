import { defineRelations } from "drizzle-orm"

import { account, recoveryCode, session, user, verification } from "./auth"
import { notification } from "./notification"
import { vaultItem } from "./vault"

export const dbRelations = defineRelations(
	{
		account,
		notification,
		recoveryCode,
		session,
		user,
		verification,
		vaultItem
	},
	(r) => ({
		account: {
			user: r.one.user({
				from: r.account.userId,
				to: r.user.id
			})
		},
		notification: {
			user: r.one.user({
				from: r.notification.userId,
				to: r.user.id
			})
		},
		recoveryCode: {
			user: r.one.user({
				from: r.recoveryCode.userId,
				to: r.user.id
			})
		},
		session: {
			user: r.one.user({
				from: r.session.userId,
				to: r.user.id
			})
		},
		user: {
			accounts: r.many.account({
				from: r.user.id,
				to: r.account.userId
			}),
			notifications: r.many.notification({
				from: r.user.id,
				to: r.notification.userId
			}),
			recoveryCodes: r.many.recoveryCode({
				from: r.user.id,
				to: r.recoveryCode.userId
			}),
			sessions: r.many.session({
				from: r.user.id,
				to: r.session.userId
			}),
			vaultItems: r.many.vaultItem({
				from: r.user.id,
				to: r.vaultItem.userId
			})
		},
		vaultItem: {
			user: r.one.user({
				from: r.vaultItem.userId,
				to: r.user.id
			})
		}
	})
)
