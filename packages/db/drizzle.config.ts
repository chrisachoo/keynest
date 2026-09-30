import { defineConfig } from "drizzle-kit"

import { env } from "./src/env"

export default defineConfig({
	dbCredentials: {
		url: env.DATABASE_URL
	},
	dialect: "sqlite",
	out: "./src/migrations",
	schema: "./src/schema/index.ts"
})
