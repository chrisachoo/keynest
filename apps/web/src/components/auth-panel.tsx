import {
	CheckCircle2,
	Fingerprint,
	KeyRound,
	LockKeyhole,
	ShieldCheck
} from "lucide-react"

import { IconBadge } from "@/components/ui/icon-badge"
import { authAssurance } from "@/constants"

const features = [
	{
		icon: KeyRound,
		title: "Passwords",
		description: "Your saved logins"
	},
	{
		icon: Fingerprint,
		title: "Passkeys",
		description: "Passwordless sign-in"
	},
	{
		icon: ShieldCheck,
		title: "Authenticator",
		description: "Two-factor codes"
	}
] as const

export default function AuthPanel() {
	return (
		<aside className="text-card-foreground relative hidden min-h-0 flex-col justify-between overflow-hidden p-8 md:flex lg:p-10">
			<div className="relative z-10 mx-auto w-full max-w-sm space-y-6">
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

				<div
					className="bg-muted/40 space-y-1 rounded-2xl border p-4"
					aria-hidden
				>
					<div className="mb-3 flex items-center gap-2">
						<ShieldCheck className="size-5 text-primary" />
						<span className="text-sm font-medium">My vault</span>
					</div>

					<div className="space-y-1 border-t pt-3">
						{features.map(({ icon: Icon, title, description }) => (
							<div
								key={title}
								className="flex items-center gap-3 rounded-xl p-3"
							>
								<IconBadge className="bg-background rounded-lg">
									<Icon className="size-5 text-primary" />
								</IconBadge>

								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium">{title}</p>
									<p className="text-muted-foreground text-xs">{description}</p>
								</div>

								<CheckCircle2 className="size-4 text-primary" />
							</div>
						))}
					</div>
				</div>
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
