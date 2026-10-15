import { createBrowserRouter, type RouteObject } from "react-router"

import { ErrorBoundary } from "@/components/error-boundary"
import { redirectIfAuthed } from "@/lib/guards"

function HydrateFallback() {
	return null
}

function inDashboard(pathname: string) {
	return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
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
		path: "/privacy",
		HydrateFallback,
		lazy: async () => {
			const { Component } = await import("./routes/privacy")
			return { Component }
		}
	},
	{
		path: "/verify-email",
		HydrateFallback,
		lazy: async () => {
			const { Component } = await import("./routes/auth/verify-email")
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
				path: "recover",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/auth/recover")
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
		id: "dashboard",
		path: "/dashboard",
		HydrateFallback,
		ErrorBoundary,
		shouldRevalidate({
			currentUrl,
			defaultShouldRevalidate,
			formAction,
			nextUrl
		}) {
			if (formAction) return true
			if (inDashboard(currentUrl.pathname) && inDashboard(nextUrl.pathname))
				return false
			return defaultShouldRevalidate
		},
		lazy: async () => {
			const route = await import("./routes/dashboard/layout")
			return {
				Component: route.Component,
				action: route.action,
				loader: route.loader
			}
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
				path: "account",
				HydrateFallback,
				lazy: async () => {
					const { Component } = await import("./routes/dashboard/account")
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
