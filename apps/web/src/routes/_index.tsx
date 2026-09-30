import {
	disconnected,
	type HealthResponse,
	healthResponse
} from "@keynest/shared"
import { useLoaderData } from "react-router"
import * as v from "valibot"

import ToggleTheme from "@/components/ui/toggle-theme"
import { api } from "@/lib/client"

export const loader = async (): Promise<HealthResponse> => {
	try {
		const response = await api.index.$get()

		if (!response.ok) return disconnected(healthResponse, "API is unreachable")

		return v.parse(healthResponse, await response.json())
	} catch {
		return disconnected(healthResponse, "API is unreachable")
	}
}

export function Component() {
	const loaderData = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="flex items-center justify-between w-full">
				<div>
					<h1 className="text-2xl font-medium">Keynest</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Private home for your digital keys.
					</p>
				</div>

				<ToggleTheme />
			</div>

			<section className="mt-6 rounded-lg border p-4">
				<h2 className="mb-2 font-medium">API status</h2>
				<div className="flex items-center gap-2">
					<div
						className={`h-2 w-2 rounded-full ${loaderData.ok ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="text-sm text-muted-foreground">
						{loaderData.ok ? "Connected" : "Disconnected"}
						{loaderData.message ? ` — ${loaderData.message}` : ""}
					</span>
				</div>
			</section>
		</div>
	)
}
