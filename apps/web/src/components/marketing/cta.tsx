import { ArrowRight } from "lucide-react"
import { Link } from "react-router"

import { marketingCopy } from "@/constants"

export default function CtaSection() {
	const { account, cta } = marketingCopy

	return (
		<section
			id="start"
			className="bg-base-100 px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
		>
			<div className="mx-auto max-w-7xl rounded-box bg-success/15 px-6 py-14 text-center sm:px-12 lg:py-16">
				<p className="text-sm font-semibold tracking-wide text-success uppercase">
					{cta.eyebrow}
				</p>
				<h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
					{cta.title}
				</h2>
				<p className="mx-auto mt-5 max-w-md text-base-content/70">{cta.body}</p>
				<Link
					to={account.getStarted.to}
					className="btn mt-8 w-full btn-primary sm:w-auto"
				>
					{cta.action}
					<ArrowRight className="size-4" />
				</Link>
			</div>
		</section>
	)
}
