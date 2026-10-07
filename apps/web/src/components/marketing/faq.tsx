import { marketingCopy } from "@/constants"

export default function FaqSection() {
	const { faq } = marketingCopy

	return (
		<section id="faq" className="scroll-mt-24 bg-base-300">
			<div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
				<div className="text-center">
					<p className="text-sm font-semibold tracking-wide text-success uppercase">
						{faq.eyebrow}
					</p>
					<h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						{faq.title}
					</h2>
				</div>
				<div className="mt-10 space-y-3">
					{faq.items.map((item, index) => (
						<div
							key={item.question}
							className="collapse-arrow collapse border border-base-300 bg-base-100"
						>
							<input
								type="radio"
								name="marketing-faq"
								defaultChecked={index === 0}
							/>
							<div className="collapse-title pe-12 font-medium">
								{item.question}
							</div>
							<div className="collapse-content text-sm leading-6 text-base-content/70">
								<p>{item.answer}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
