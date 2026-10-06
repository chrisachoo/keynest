export const vaultCopy = {
	all: {
		description: "Your private home for digital keys.",
		eyebrow: "Personal vault",
		section: "Recently used",
		title: "Vault"
	},
	favorites: {
		description: "Your private home for digital keys.",
		eyebrow: "Personal vault",
		section: "Favorite items",
		title: "Favorites"
	},
	notes: {
		description: "Your private home for digital keys.",
		eyebrow: "Personal vault",
		section: "Your notes",
		title: "Secure notes"
	}
} as const

export const authAssurance = "Your credentials. Your control."

export const authCopy = {
	login: {
		title: "Welcome back",
		subtitle: "Log in to pick up where you left off.",
		submit: "Log in",
		pending: "Logging in...",
		switchPrompt: "New here?",
		switchLink: "Create an account",
		switchTo: "/signup",
		passwordAutoComplete: "current-password",
		showForgotPassword: true
	},
	signup: {
		title: "Create your account",
		subtitle: "It takes less than a minute to get started.",
		submit: "Create account",
		pending: "Creating account...",
		switchPrompt: "Already have an account?",
		switchLink: "Log in",
		switchTo: "/login",
		passwordAutoComplete: "new-password",
		showForgotPassword: false
	}
} as const

export type AuthMode = keyof typeof authCopy
