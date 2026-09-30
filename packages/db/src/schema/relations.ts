import { defineRelations } from "drizzle-orm"

import { account, session, user, verification } from "./auth"
import { vaultItem } from "./vault"

export const dbRelations = defineRelations(
	{ account, session, user, verification, vaultItem },
	(r) => ({
		account: {
			user: r.one.user({
				from: r.account.userId,
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
