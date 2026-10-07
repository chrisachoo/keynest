import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { KeyRound } from "lucide-react"
import type { MouseEvent } from "react"
import { Link, useLocation } from "react-router"

import { marketingCopy } from "@/constants"

const logoVariants = cva(
	"flex items-center justify-center rounded-full bg-primary text-primary-content",
	{
		defaultVariants: {
			size: "xs"
		},
		variants: {
			size: {
				xs: "size-8 [&_svg]:size-4",
				sm: "size-10 [&_svg]:size-5",
				md: "size-12 [&_svg]:size-6"
			}
		}
	}
)

type LogoProps = {
	"aria-label"?: string
	className?: string
	logoClassName?: string
	name?: boolean
	onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
	to?: string
} & VariantProps<typeof logoVariants>

export default function Logo({
	name = false,
	size,
	className,
	logoClassName,
	to,
	onClick,
	"aria-label": ariaLabel
}: Readonly<LogoProps>) {
	const { pathname } = useLocation()

	const mark = (
		<>
			<div className={cn(logoVariants({ size }), logoClassName)}>
				<KeyRound />
			</div>
			{name && (
				<span className="text-base font-semibold tracking-tight">
					{marketingCopy.brand.name}
				</span>
			)}
		</>
	)

	if (!to) {
		return (
			<div className={cn("flex items-center gap-2", className)}>{mark}</div>
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
			className={cn("flex items-center gap-2", className)}
		>
			{mark}
		</Link>
	)
}
