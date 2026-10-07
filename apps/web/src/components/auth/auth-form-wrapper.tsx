import { CircleAlert, LockKeyhole } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import { authAssurance, authCopy } from "@/constants"

import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import Logo from "../ui/logo"
import SocialButtons from "../ui/social-buttons"

type AuthFormWrapperProps = {
	children: ReactNode
	serverError: string | null
	authCopyKey: keyof typeof authCopy
}

export default function AuthFormWrapper({
	children,
	serverError,
	authCopyKey
}: AuthFormWrapperProps) {
	const { title, subtitle, switchLink, switchPrompt, switchTo } =
		authCopy[authCopyKey]

	return (
		<div className="mx-auto flex w-full max-w-md flex-col justify-center gap-7">
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
					<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
					<p className="text-muted-foreground text-sm">{subtitle}</p>
				</div>
			</div>

			<SocialButtons />

			<div className="relative flex items-center">
				<div className="flex-1 border-t" />
				<span className="text-muted-foreground px-3 text-xs">
					OR CONTINUE WITH EMAIL
				</span>
				<div className="flex-1 border-t" />
			</div>

			{children}

			<div className="text-muted-foreground text-center text-sm">
				{switchPrompt}{" "}
				<Link className="link link-primary" to={switchTo}>
					{switchLink}
				</Link>
			</div>

			<div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
				<LockKeyhole className="size-3.5" />
				{authAssurance}
			</div>
		</div>
	)
}
