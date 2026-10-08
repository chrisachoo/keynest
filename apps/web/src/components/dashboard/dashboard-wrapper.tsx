import type { ReactNode } from "react"

export default function DashboardWrapper({
	actions,
	children,
	description,
	title
}: Readonly<{
	actions?: ReactNode
	children: ReactNode
	description?: string
	title: string
}>) {
	return (
		<main className="flex w-full max-w-5xl flex-col gap-6 px-5 py-6 text-left sm:px-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 space-y-1">
					<h1 className="text-2xl font-semibold">{title}</h1>
					{description ? (
						<p className="text-sm text-base-content/60">{description}</p>
					) : null}
				</div>
				{actions}
			</div>
			{children}
		</main>
	)
}
