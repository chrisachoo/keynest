import { createBrowserRouter, type RouteObject } from "react-router"

import { ErrorBoundary } from "@/components/error-boundary"
import { redirectIfAuthed, requireAuth } from "@/lib/guards"

function HydrateFallback() {
	return null
}

export const routes = [
	{
		path: "/",
		HydrateFallback,
		lazy: async () => {
			const { Component } = await import("./routes/_index")
			return { Component }
		}
	},
	{
		path: "/",
		HydrateFallback,
		ErrorBoundary,
		lazy: async () => {
			const { Component } = await import("./routes/auth/layout")
			return { Component, loader: redirectIfAuthed }
		},
		children: [
			{
				path: "login",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/auth/login")
					return { Component }
				}
			},
			{
				path: "signup",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/auth/signup")
					return { Component }
				}
			}
		]
	},
	{
		path: "/dashboard",
		HydrateFallback,
		ErrorBoundary,
		lazy: async () => {
			const { Component } = await import("./routes/dashboard/layout")
			return { Component, loader: requireAuth }
		},
		children: [
			{
				index: true,
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/index")
					return { Component }
				}
			},
			{
				path: "favorites",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/favorites")
					return { Component }
				}
			},
			{
				path: "notes",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/notes")
					return { Component }
				}
			},
			{
				path: "settings",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/settings")
					return { Component }
				}
			},
			{
				path: "password",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/password")
					return { Component }
				}
			}
		]
	}
] satisfies RouteObject[]

export const router = createBrowserRouter(routes)
