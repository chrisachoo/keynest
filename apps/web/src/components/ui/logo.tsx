import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import type { MouseEvent } from "react"
import { Link, useLocation } from "react-router"

import { marketingCopy } from "@/constants"

import KeynestMark from "./keynest-mark"

const wordmarkVariants = cva("font-semibold tracking-tight", {
	defaultVariants: {
		size: "xs"
	},
	variants: {
		size: {
			xs: "text-base",
			sm: "text-base",
			md: "text-lg"
		}
	}
})

type LogoProps = {
	"aria-label"?: string
	className?: string
	logoClassName?: string
	markVariant?: "dark" | "light" | "mark"
	name?: boolean
	onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
	to?: string
} & VariantProps<typeof wordmarkVariants>

export default function Logo({
	name = false,
	size,
	className,
	logoClassName,
	markVariant = "dark",
	to,
	onClick,
	"aria-label": ariaLabel
}: Readonly<LogoProps>) {
	const { pathname } = useLocation()

	const mark = (
		<>
			<KeynestMark
				size={size ?? "xs"}
				variant={markVariant}
				className={logoClassName}
			/>
			{name ? (
				<span className={wordmarkVariants({ size })}>
					{marketingCopy.brand.name}
				</span>
			) : null}
		</>
	)

	if (!to) {
		return (
			<div className={cn("flex items-center gap-2.5", className)}>{mark}</div>
		)
	}

	function handleClick(event: MouseEvent<HTMLAnchorElement>) {
		onClick?.(event)
		if (event.defaultPrevented || pathname !== "/" || to !== "/") return

		event.preventDefault()
		const reduceMotion = globalThis.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches
		globalThis.scrollTo({
			behavior: reduceMotion ? "auto" : "smooth",
			top: 0
		})
	}

	return (
		<Link
			to={to}
			aria-label={ariaLabel}
			onClick={handleClick}
			className={cn("flex items-center gap-2.5", className)}
		>
			{mark}
		</Link>
	)
}
