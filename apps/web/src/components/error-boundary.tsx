import type { ReactNode } from "react"
import { isRouteErrorResponse, Link, useRouteError } from "react-router"

import { Button } from "@/components/ui/button"

function ErrorCard({
	title,
	message,
	children
}: Readonly<{
	title: string
	message: string
	children?: ReactNode
}>) {
	return (
		<main className="grid min-h-screen place-items-center bg-base-200 p-4">
			<div role="alert" className="card w-full max-w-xl bg-base-100 shadow-sm">
				<div className="card-body">
					<h1 className="card-title text-2xl text-error">{title}</h1>
					<p className="text-base-content/80">{message}</p>

					{children}

					<div className="mt-2 card-actions justify-end">
						<Link to="/" className="btn btn-ghost">
							Go home
						</Link>
						<Button onClick={() => globalThis.location.reload()}>
							Try again
						</Button>
					</div>
				</div>
			</div>
		</main>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()

	if (isRouteErrorResponse(error)) {
		return (
			<ErrorCard
				title={`${error.status} ${error.statusText}`}
				message={
					typeof error.data === "string"
						? error.data
						: "This page couldn't be loaded."
				}
			/>
		)
	}

	if (error instanceof Error) {
		return (
			<ErrorCard title="Something went wrong" message={error.message}>
				{error.stack && (
					<details className="collapse-arrow collapse border border-base-300 bg-base-200">
						<summary className="collapse-title text-sm font-medium">
							Stack trace
						</summary>
						<div className="collapse-content">
							<pre className="max-h-64 overflow-auto text-xs">
								{error.stack}
							</pre>
						</div>
					</details>
				)}
			</ErrorCard>
		)
	}

	return (
		<ErrorCard
			title="Something went wrong"
			message="An unexpected error occurred. Try again, or head back home."
		/>
	)
}
