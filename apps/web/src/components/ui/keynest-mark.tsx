import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { useId } from "react"

import { KEYNEST_MARK_VIEWBOX, KeynestMarkShapes } from "./keynest-mark-paths"

const markVariants = cva("shrink-0 rounded-[21.875%]", {
	defaultVariants: {
		size: "md",
		variant: "dark"
	},
	variants: {
		size: {
			lg: "size-16",
			md: "size-12",
			sm: "size-10",
			xs: "size-8"
		},
		variant: {
			dark: "",
			light: "",
			mark: ""
		}
	}
})

type KeynestMarkProps = {
	className?: string
	title?: string
} & VariantProps<typeof markVariants>

export default function KeynestMark({
	className,
	size,
	title = "Keynest",
	variant
}: Readonly<KeynestMarkProps>) {
	const resolvedVariant = variant ?? "dark"
	const idPrefix = useId().replace(/:/g, "")

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${KEYNEST_MARK_VIEWBOX} ${KEYNEST_MARK_VIEWBOX}`}
			fill="none"
			role="img"
			aria-label={title}
			className={cn(
				markVariants({ size, variant: resolvedVariant }),
				className
			)}
		>
			<title>{title}</title>
			<KeynestMarkShapes idPrefix={idPrefix} variant={resolvedVariant} />
		</svg>
	)
}
