import { defineConfig } from "oxlint"

export default defineConfig({
	categories: {
		correctness: "error",
		perf: "warn",
		suspicious: "warn"
	},
	env: {
		builtin: true
	},
	ignorePatterns: ["**/dist", "**/migrations", "**/*.gen.ts"],
	overrides: [
		{
			files: [
				"**/env.ts",
				"**/env.*.ts",
				"**/drizzle.config.ts",
				"**/alchemy.run.ts"
			],
			rules: {
				"node/no-process-env": "off"
			}
		}
	],
	plugins: ["typescript", "unicorn", "oxc", "node"],
	rules: {
		"no-console": "warn",
		"no-redeclare": "off",
		"node/no-process-env": "error",
		"node/no-top-level-await": "off",
		"typescript/consistent-type-definitions": ["error", "type"],
		"unicorn/filename-case": [
			"error",
			{
				case: "kebabCase",
				ignore: ["README.md", "DEPLOYMENT.md"]
			}
		],
		"unicorn/prefer-global-this": "error"
	}
})
