import * as Cloudflare from "alchemy/Cloudflare"

export const db = Cloudflare.D1.Database("database", {
	migrations: "../../packages/db/src/migrations"
})
