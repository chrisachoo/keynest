import type { ComponentProps, MouseEvent } from "react"

type SectionLinkProps = Omit<ComponentProps<"a">, "href"> & {
	href: `#${string}`
}

function scrollToSection(id: string) {
	const target = document.getElementById(id)
	if (!target) return

	const reduceMotion = globalThis.matchMedia(
		"(prefers-reduced-motion: reduce)"
	).matches

	target.scrollIntoView({
		behavior: reduceMotion ? "auto" : "smooth",
		block: "start"
	})
}

export default function SectionLink({
	href,
	onClick,
	...props
}: SectionLinkProps) {
	function handleClick(event: MouseEvent<HTMLAnchorElement>) {
		event.preventDefault()
		onClick?.(event)
		const id = href.slice(1)
		requestAnimationFrame(() => scrollToSection(id))
	}

	return <a href={href} onClick={handleClick} {...props} />
}
