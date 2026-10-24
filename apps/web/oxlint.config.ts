import { defineConfig } from "oxlint"

import baseConfig from "../../oxlint.config.ts"

export default defineConfig({
	extends: [baseConfig],
	plugins: ["react"],
	rules: {
		"react/only-export-components": [
			"warn",
			{
				allowConstantExport: true,
				allowExportNames: ["loader", "action", "*Variants"]
			}
		],
		"react/react-in-jsx-scope": "off",
		"react/rules-of-hooks": "error"
	},
	overrides: [
		{
			files: ["src/components/ui/**/*.tsx"],
			rules: {
				"react/only-export-components": "off"
			}
		}
	]
})
