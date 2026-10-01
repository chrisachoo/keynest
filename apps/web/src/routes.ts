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
	},
	{
		path: "/dashboard",
		HydrateFallback,
		lazy: async () => {
			const { Component } = await import("./routes/dashboard/layout")
			return { Component }
		},
		children: [
			{
				index: true,
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/index")
					return { Component }
				}
			}
		]
	}
] satisfies RouteObject[]
