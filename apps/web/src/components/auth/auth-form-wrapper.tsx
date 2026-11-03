import { cn } from "cn"
import { CircleAlert, LockKeyhole } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"
import { Link } from "react-router"

import { authAssurance, authCopy } from "@/constants"

import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import Logo from "../ui/logo"

export type AuthStep = "account" | "email" | "recovery"

const steps: Array<{ id: AuthStep; label: string }> = [
	{ id: "account", label: "Account" },
	{ id: "recovery", label: "Recovery" },
	{ id: "email", label: "Email" }
]

type AuthFormWrapperProps = {
	authCopyKey: keyof typeof authCopy
	children: ReactNode
	serverError: string | null
	showSwitch?: boolean
	stageKey?: string
	step?: AuthStep
	subtitle?: string
	title?: string
}

export default function AuthFormWrapper({
	children,
	serverError,
	authCopyKey,
	showSwitch = true,
	stageKey,
	step,
	subtitle,
	title
}: AuthFormWrapperProps) {
	const copy = authCopy[authCopyKey]
	const heading = title ?? copy.title
	const lede = subtitle ?? copy.subtitle
	const headingRef = useRef<HTMLHeadingElement>(null)
	const skipFocus = useRef(true)
	const activeIndex = step ? steps.findIndex((item) => item.id === step) : -1
	const showLegal = authCopyKey === "signup" && (!step || step === "account")

	useEffect(() => {
		if (skipFocus.current) {
			skipFocus.current = false
			return
		}
		if (heading) headingRef.current?.focus()
	}, [heading])

	return (
		<div
			className={cn(
				"mx-auto flex w-full max-w-md flex-col justify-center gap-7",
				stageKey && "min-h-136"
			)}
		>
			<div className="flex flex-col items-center gap-4 text-center">
				{serverError && (
					<Alert
						className="w-full"
						variant="destructive"
						icon={<CircleAlert className="size-5 shrink-0" />}
					>
						<AlertTitle>Something went wrong</AlertTitle>
						<AlertDescription>{serverError}</AlertDescription>
					</Alert>
				)}

				<Logo size="md" to="/" />

				<div className="space-y-2">
					<h1
						className="text-3xl font-semibold tracking-tight"
						ref={headingRef}
						tabIndex={-1}
					>
						{heading}
					</h1>
					<p className="text-muted-foreground text-sm">{lede}</p>
				</div>

				{step ? (
					<ul aria-label="Create account" className="steps w-full text-xs">
						{steps.map((item, index) => (
							<li
								aria-current={index === activeIndex ? "step" : undefined}
								className={cn("step", index <= activeIndex && "step-primary")}
								key={item.id}
							>
								{item.label}
							</li>
						))}
					</ul>
				) : null}
			</div>

			{stageKey ? (
				<div
					className="animate-in duration-300 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
					key={stageKey}
				>
					{children}
				</div>
			) : (
				children
			)}

			{showSwitch ? (
				<div className="text-muted-foreground text-center text-sm">
					{copy.switchPrompt}{" "}
					<Link className="link link-primary" to={copy.switchTo}>
						{copy.switchLink}
					</Link>
				</div>
			) : null}

			{showLegal ? (
				<p className="text-muted-foreground text-center text-xs">
					By creating an account you agree to the{" "}
					<Link className="link" to="/terms">
						Terms
					</Link>{" "}
					and{" "}
					<Link className="link" to="/privacy">
						Privacy
					</Link>{" "}
					pages.
				</p>
			) : null}

			<div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
				<LockKeyhole className="size-3.5" />
				{authAssurance}
			</div>
		</div>
	)
}
