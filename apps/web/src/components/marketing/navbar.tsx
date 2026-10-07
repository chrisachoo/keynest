import { cn } from "cn"
import { ArrowRight, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router"

import Logo from "@/components/ui/logo"
import ToggleTheme from "@/components/ui/toggle-theme"
import { marketingCopy } from "@/constants"

import SectionLink from "./section-link"

const MARKETING_NAV_ID = "marketing-nav"

type MarketingDrawerProps = {
	onNavigate: () => void
}

export function MarketingDrawer({ onNavigate }: MarketingDrawerProps) {
	const { account, footer, nav } = marketingCopy

	return (
		<div className="drawer-side z-50">
			<label
				htmlFor={MARKETING_NAV_ID}
				aria-label="Close menu"
				className="drawer-overlay"
			/>
			<div className="flex min-h-full w-72 max-w-[85vw] flex-col bg-base-100 p-4 text-base-content">
				<div className="mb-2 flex items-center justify-between">
					<Logo
						name
						to="/"
						aria-label={footer.homeLabel}
						onClick={onNavigate}
					/>
					<label
						htmlFor={MARKETING_NAV_ID}
						aria-label="Close menu"
						className="btn btn-square btn-ghost btn-sm"
					>
						<X className="size-5" />
					</label>
				</div>
				<ul className="menu w-full grow menu-lg px-0">
					{nav.map(({ title, url }) => (
						<li key={url}>
							<SectionLink href={url} onClick={onNavigate}>
								{title}
							</SectionLink>
						</li>
					))}
				</ul>
				<div className="flex flex-col gap-2">
					<Link
						to={account.signIn.to}
						className="btn btn-ghost"
						onClick={onNavigate}
					>
						{account.signIn.title}
					</Link>
					<Link
						to={account.getStarted.to}
						className="btn btn-primary"
						onClick={onNavigate}
					>
						{account.getStarted.title}
						<ArrowRight className="size-4" />
					</Link>
				</div>
			</div>
		</div>
	)
}

export default function Navbar() {
	const { account, footer, nav } = marketingCopy
	const [isScrolled, setIsScrolled] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 8)
		}

		handleScroll()
		window.addEventListener("scroll", handleScroll, { passive: true })
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	return (
		<header
			className={cn(
				"sticky top-0 z-40 w-full border-b border-base-300 bg-base-100/80 backdrop-blur-lg transition-shadow",
				isScrolled && "shadow-sm"
			)}
		>
			<nav className="navbar mx-auto w-full max-w-7xl px-2 sm:px-4">
				<div className="navbar-start">
					<label
						htmlFor={MARKETING_NAV_ID}
						aria-label="Open menu"
						className="btn btn-square btn-ghost lg:hidden"
					>
						<Menu className="size-5" />
					</label>
					<Logo
						name
						to="/"
						aria-label={footer.homeLabel}
						className="hidden lg:inline-flex"
					/>
				</div>

				<div className="navbar-center">
					<Logo
						name
						to="/"
						aria-label={footer.homeLabel}
						className="lg:hidden"
					/>
					<ul className="menu menu-horizontal hidden px-1 lg:flex">
						{nav.map(({ title, url }) => (
							<li key={url}>
								<SectionLink href={url}>{title}</SectionLink>
							</li>
						))}
					</ul>
				</div>

				<div className="navbar-end gap-1">
					<ToggleTheme />
					<Link
						to={account.signIn.to}
						className="btn hidden btn-ghost lg:inline-flex"
					>
						{account.signIn.title}
					</Link>
					<Link
						to={account.getStarted.to}
						className="btn hidden btn-primary lg:inline-flex"
					>
						{account.getStarted.title}
						<ArrowRight className="size-4" />
					</Link>
				</div>
			</nav>
		</header>
	)
}

export { MARKETING_NAV_ID }
