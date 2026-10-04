import { defineConfig } from "oxfmt"

export default defineConfig({
	arrowParens: "always",
	bracketSpacing: true,
	printWidth: 80,
	quoteProps: "as-needed",
	semi: false,
	singleAttributePerLine: false,
	singleQuote: false,
	sortImports: true,
	sortTailwindcss: {
		stylesheet: "./apps/web/src/app.css",
		functions: ["clsx", "cn"],
		preserveWhitespace: true
	},
	tabWidth: 2,
	trailingComma: "none",
	useTabs: true
})
