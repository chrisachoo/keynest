import type { ReactNode } from "react"

export default function PageHeading({
	children,
	description,
	eyebrow,
	title
}: Readonly<{
	children?: ReactNode
	description: string
	eyebrow: string
	title: string
}>) {
	return (
		<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div className="space-y-2">
				<p className="text-xs font-medium tracking-wide text-base-content/60 uppercase">
					{eyebrow}
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
				<p className="text-sm text-base-content/60">{description}</p>
			</div>

			{children}
		</div>
	)
}
