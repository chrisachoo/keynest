import {
	CheckCircle2,
	Fingerprint,
	LockKeyhole,
	ShieldCheck,
	type LucideIcon
} from "lucide-react"

import { IconBadge } from "@/components/ui/icon-badge"
import KeynestMark from "@/components/ui/keynest-mark"
import { authAssurance } from "@/constants"

export type AuthPanelMode =
	| "confirmed"
	| "confirming"
	| "default"
	| "inbox"
	| "recovery"

const guides: Record<
	Exclude<AuthPanelMode, "default">,
	{ detail: string; kicker: string; title: string }
> = {
	confirmed: {
		detail: "Use the password you chose when you created the account.",
		kicker: "Email confirmed",
		title: "Sign in to unlock your vault."
	},
	confirming: {
		detail:
			"This confirms the address. Your vault stays locked until you sign in.",
		kicker: "Confirm your email",
		title: "Checking this link."
	},
	inbox: {
		detail:
			"Then sign in with your password. The vault stays locked until you do.",
		kicker: "Confirm your email",
		title: "Open the link from your inbox."
	},
	recovery: {
		detail:
			"Copy the words or download the file. Keynest cannot show them again.",
		kicker: "Recovery code",
		title: "Save these words."
	}
}

const features: Array<
	| { description: string; icon: LucideIcon; title: string }
	| { description: string; mark: true; title: string }
> = [
	{
		description: "Your saved logins",
		mark: true,
		title: "Passwords"
	},
	{
		description: "Passwordless sign-in",
		icon: Fingerprint,
		title: "Passkeys"
	},
	{
		description: "Two-factor codes",
		icon: ShieldCheck,
		title: "Authenticator"
	}
]

export default function AuthPanel({
	mode = "default"
}: Readonly<{ mode?: AuthPanelMode }>) {
	const guide = mode === "default" ? null : guides[mode]

	return (
		<aside className="text-card-foreground relative hidden min-h-0 flex-col justify-between overflow-hidden p-8 md:flex lg:p-10">
			<div
				key={mode}
				className="relative z-10 mx-auto w-full max-w-sm animate-in space-y-6 duration-300 ease-out fade-in motion-reduce:animate-none"
			>
				{guide ? (
					<div className="space-y-3">
						<div className="bg-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
							<ShieldCheck className="size-3.5 text-primary" />
							{guide.kicker}
						</div>
						<h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">
							{guide.title}
						</h2>
						<p className="text-muted-foreground text-sm leading-6">
							{guide.detail}
						</p>
					</div>
				) : (
					<div className="space-y-3">
						<div className="bg-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
							<ShieldCheck className="size-3.5 text-primary" />
							Your digital safehouse
						</div>

						<h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">
							Everything secure.{" "}
							<span className="text-muted-foreground block">
								Everything in its place.
							</span>
						</h2>

						<p className="text-muted-foreground text-sm leading-6">
							Your passwords, passkeys and authentication codes, together in one
							private vault.
						</p>
					</div>
				)}

				{guide ? null : (
					<div
						className="bg-muted/40 space-y-1 rounded-2xl border p-4"
						aria-hidden
					>
						<div className="mb-3 flex items-center gap-2">
							<ShieldCheck className="size-5 text-primary" />
							<span className="text-sm font-medium">My vault</span>
						</div>

						<div className="space-y-1 border-t pt-3">
							{features.map((feature) => (
								<div
									key={feature.title}
									className="flex items-center gap-3 rounded-xl p-3"
								>
									<IconBadge className="bg-background rounded-lg">
										{"mark" in feature ? (
											<KeynestMark
												size="sm"
												variant="mark"
												className="size-5"
											/>
										) : (
											<feature.icon className="size-5 text-primary" />
										)}
									</IconBadge>

									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">{feature.title}</p>
										<p className="text-muted-foreground text-xs">
											{feature.description}
										</p>
									</div>

									<CheckCircle2 className="size-4 text-primary" />
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="text-muted-foreground relative z-10 flex items-center gap-2 text-xs">
				<LockKeyhole className="size-4 text-primary" />
				{authAssurance}
			</div>

			<div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-lime-300/[0.07] blur-3xl" />
			<div className="pointer-events-none absolute -bottom-32 -left-24 size-72 rounded-full bg-emerald-400/6 blur-3xl" />
		</aside>
	)
}
