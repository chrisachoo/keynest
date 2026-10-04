import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { KeyRound } from "lucide-react"
import type { ComponentProps } from "react"

const logoVariants = cva(
	"flex items-center justify-center rounded-lg bg-primary text-primary-content",
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
	name?: boolean
	logoClassName?: string
} & ComponentProps<"div"> &
	VariantProps<typeof logoVariants>

export default function Logo({
	name = false,
	size,
	className,
	logoClassName,
	...props
}: Readonly<LogoProps>) {
	return (
		<div
			className={cn("flex cursor-pointer items-center gap-2", className)}
			{...props}
		>
			<div className={cn(logoVariants({ size }), logoClassName)}>
				<KeyRound />
			</div>

			{name && (
				<span className="text-base font-semibold tracking-tight">keynest</span>
			)}
		</div>
	)
}
