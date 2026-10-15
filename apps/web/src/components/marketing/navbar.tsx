import { cn } from "cn"
import { ArrowRight, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, NavLink } from "react-router"

import { DrawerTrigger } from "@/components/ui/drawer"
import Logo from "@/components/ui/logo"
import ToggleTheme from "@/components/ui/toggle-theme"
import { marketingCopy } from "@/constants"

import SectionLink from "./section-link"

type MarketingDrawerProps = {
	onNavigate: () => void
}

export function MarketingDrawer({
	onNavigate
}: Readonly<MarketingDrawerProps>) {
	const { account, footer, nav, privacy } = marketingCopy

	return (
		<div className="flex min-h-full w-72 max-w-[85vw] flex-col bg-base-100 p-4 text-base-content">
			<div className="mb-2 flex items-center justify-between">
				<Logo name to="/" aria-label={footer.homeLabel} onClick={onNavigate} />
				<DrawerTrigger
					aria-label="Close menu"
					className="btn btn-square btn-ghost btn-sm"
				>
					<X className="size-5" />
				</DrawerTrigger>
			</div>

			<ul className="menu w-full grow menu-lg px-0">
				<li>
					<h2 className="menu-title">Keynest</h2>
					<ul>
						{nav.map(({ title, url }) => (
							<li key={url}>
								<SectionLink href={url} onClick={onNavigate}>
									{title}
								</SectionLink>
							</li>
						))}
					</ul>

					<h2 className="menu-title">Privacy & Policy</h2>
					<ul>
						{privacy.map(({ title, url }) => (
							<li key={url}>
								<NavLink to={url} discover="render" end>
									{title}
								</NavLink>
							</li>
						))}
					</ul>
				</li>
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
					<DrawerTrigger
						aria-label="Open menu"
						className="btn btn-square btn-ghost lg:hidden"
					>
						<Menu className="size-5" />
					</DrawerTrigger>
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
