import { Check, Fingerprint, LockKeyhole } from "lucide-react"

import { marketingCopy } from "@/constants"

export default function SecuritySection() {
	const { security } = marketingCopy

	return (
		<section id="security" className="scroll-mt-24 bg-base-100">
			<div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-24">
				<div>
					<span className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
						<Fingerprint className="size-6" />
					</span>
					<h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						{security.title}
					</h2>
					<p className="mt-5 max-w-lg leading-7 text-base-content/70">
						{security.body}
					</p>
					<ul className="mt-7 grid gap-3 text-sm">
						{security.points.map((point) => (
							<li key={point} className="flex items-start gap-2">
								<Check className="mt-0.5 size-4 shrink-0 text-success" />
								<span>{point}</span>
							</li>
						))}
					</ul>
				</div>
				<div className="card bg-base-content text-base-100">
					<div className="card-body gap-8 p-8 sm:p-12">
						<div className="flex items-center gap-3">
							<LockKeyhole className="size-7 text-success" />
							<p className="text-sm font-medium text-base-100/70">
								{security.cardEyebrow}
							</p>
						</div>
						<p className="max-w-sm text-2xl leading-tight font-medium tracking-tight text-balance sm:text-3xl">
							{security.cardTitle}
						</p>
						<p className="max-w-sm text-sm leading-6 text-base-100/70">
							{security.cardCaption}
						</p>
					</div>
				</div>
			</div>
		</section>
	)
}
