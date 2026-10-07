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

export const marketingCopy = {
	account: {
		getStarted: { title: "Get started", to: "/signup" },
		signIn: { title: "Sign in", to: "/login" }
	},
	brand: {
		name: "keynest",
		tagline: "A private password manager for everyday life."
	},
	cta: {
		action: "Create your free vault",
		body: "Create a free Keynest vault for passwords, secure notes, and the details you want close at hand.",
		eyebrow: "Free password vault",
		title: "Open your private password vault."
	},
	faq: {
		eyebrow: "Password manager FAQ",
		items: [
			{
				answer:
					"Yes. Keynest is a password manager for logins, secure notes, and Wi-Fi passwords, kept in one private vault you can search in seconds.",
				question: "Is Keynest a password manager?"
			},
			{
				answer:
					"No. Your vault is encrypted before it leaves your device. Keynest cannot read your master password or the passwords you store.",
				question: "Can Keynest read my passwords?"
			},
			{
				answer:
					"Secure notes, Wi-Fi passwords, and other important documents, stored next to your logins in the same encrypted vault.",
				question: "What can I store besides passwords?"
			},
			{
				answer:
					"Yes. Generate a stronger password when you need one, then save it straight into your vault.",
				question: "Does Keynest include a password generator?"
			}
		],
		title: "Questions about your vault."
	},
	features: {
		body: "Save logins, write secure notes, and generate stronger passwords in one private vault, without turning security into a second job.",
		eyebrow: "Password vault",
		items: [
			{
				key: "home",
				text: "Keep logins, secure notes, Wi-Fi passwords, and important documents together in one private vault.",
				title: "Passwords, notes, and Wi-Fi in one vault"
			},
			{
				key: "private",
				text: "Your vault is encrypted before it leaves your device. Keynest cannot read your master password or your data.",
				title: "Encrypted on your device"
			},
			{
				key: "effortless",
				text: "Create stronger passwords, find a login in seconds, and spend less time thinking about security.",
				title: "A built-in password generator"
			}
		],
		title: "A password manager that stays simple."
	},
	footer: {
		copyright: "Copyright © 2026 - All rights reserved by Keynest",
		homeLabel: "Keynest home"
	},
	hero: {
		badge: "Private password manager",
		body: "Keynest keeps your logins, secure notes, and Wi-Fi passwords in one encrypted vault — organized, close at hand, and out of the way.",
		highlights: [
			{ key: "private", label: "Encrypted on your device" },
			{ key: "credit", label: "No credit card" },
			{ key: "human", label: "Free to start" }
		],
		primaryCta: "Create your free vault",
		secondaryCta: "How encryption works",
		title: "Your private home for",
		titleAccent: "passwords and notes."
	},
	nav: [
		{ title: "Features", url: "#features" },
		{ title: "Security", url: "#security" },
		{ title: "FAQ", url: "#faq" }
	],
	preview: {
		eyebrow: "Your vault",
		greeting: "Good morning, Olivia",
		healthLabel: "Vault health",
		healthStatus: "Excellent · 92%",
		healthValue: 92,
		items: [
			{
				detail: "olivia@keynest.io",
				initial: "GH",
				key: "github",
				name: "GitHub"
			},
			{
				detail: "olivia@keynest.io",
				initial: "N",
				key: "notion",
				name: "Notion"
			},
			{
				detail: "olivia@keynest.io",
				initial: "L",
				key: "linear",
				name: "Linear"
			},
			{
				detail: "Network details for our apartment.",
				initial: "W",
				key: "wifi",
				name: "Wi-Fi password"
			}
		],
		recentLabel: "Recent items",
		status: "Vault unlocked",
		workspace: ["Vault", "Favorites", "Secure notes", "Generator"],
		workspaceTitle: "Workspace"
	},
	security: {
		body: "Keynest is a password manager built on one promise: your private information belongs to you. Your vault is encrypted before it leaves your device, so you can stay protected without becoming a security expert.",
		points: [
			"Passwords encrypted before they leave your device",
			"A vault you can search in seconds",
			"A password generator built right in"
		],
		cardCaption:
			"Logins, notes, and Wi-Fi passwords are encrypted before they are saved. Keynest cannot open your vault or read what is inside.",
		cardEyebrow: "What stays private",
		cardTitle: "Your master password never leaves your device.",
		title: "Your passwords stay yours."
	},
	seo: {
		description:
			"Keynest is a private password manager for logins, secure notes, and Wi-Fi passwords. Your vault is encrypted before it leaves your device.",
		title: "Keynest | Private password manager"
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

export const RANDOM_TOGGLES = [
	{ key: "uppercase", label: "Uppercase letters" },
	{ key: "lowercase", label: "Lowercase letters" },
	{ key: "numbers", label: "Numbers" },
	{ key: "symbols", label: "Symbols" },
	{ key: "excludeAmbiguous", label: "Exclude ambiguous characters" }
] as const

export const MEMORABLE_TOGGLES = [
	{ key: "capitalize", label: "Uppercase letters" },
	{ key: "numbers", label: "Numbers" }
] as const

export type AuthMode = keyof typeof authCopy
