import type { RouteObject } from "react-router"

function HydrateFallback() {
	return null
}

export const routes = [
	{
		path: "/",
		HydrateFallback,
		lazy: async () => {
			const { Component, loader } = await import("./routes/_index")
			return { Component, loader }
		}
	}
] satisfies RouteObject[]
