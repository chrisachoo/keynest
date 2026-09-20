import { defineConfig } from "oxlint"

export default defineConfig({
	categories: {
		correctness: "error"
	},
	env: {
		builtin: true
	},
	ignorePatterns: ["**/migrations"],
	plugins: ["typescript", "unicorn", "oxc", "node"],
	rules: {
		"no-console": "warn",
		"no-redeclare": "off",
		"node/no-process-env": "error",
		"node/no-top-level-await": "off",
		"sort-imports": "error",
		"sort-keys": "error",
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
