import {
	LockKeyhole,
	ShieldCheck,
	Sparkles,
	type LucideIcon
} from "lucide-react"

import { marketingCopy } from "@/constants"

const featureIcons = {
	effortless: Sparkles,
	home: LockKeyhole,
	private: ShieldCheck
} as const satisfies Record<
	(typeof marketingCopy.features.items)[number]["key"],
	LucideIcon
>

export default function FeaturesSection() {
	const { features } = marketingCopy

	return (
		<section id="features" className="scroll-mt-24 bg-success/10">
			<div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
				<div className="max-w-xl">
					<p className="text-sm font-semibold tracking-wide text-success uppercase">
						{features.eyebrow}
					</p>
					<h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						{features.title}
					</h2>
					<p className="mt-4 leading-7 text-base-content/70">{features.body}</p>
				</div>
				<div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{features.items.map(({ key, text, title }) => {
						const Icon = featureIcons[key]

						return (
							<article key={key} className="card bg-base-100 card-border">
								<div className="card-body">
									<span className="grid size-11 place-items-center rounded-full bg-success/10 text-success">
										<Icon className="size-5" />
									</span>
									<h3 className="card-title text-lg">{title}</h3>
									<p className="text-sm leading-6 text-base-content/70">
										{text}
									</p>
								</div>
							</article>
						)
					})}
				</div>
			</div>
		</section>
	)
}
