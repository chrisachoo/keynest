import { useEffect } from "react"

import CtaSection from "@/components/marketing/cta"
import FaqSection from "@/components/marketing/faq"
import FeaturesSection from "@/components/marketing/features"
import SiteFooter from "@/components/marketing/footer"
import HeroSection from "@/components/marketing/hero"
import Navbar, {
	MARKETING_NAV_ID,
	MarketingDrawer
} from "@/components/marketing/navbar"
import SecuritySection from "@/components/marketing/security"
import { marketingCopy } from "@/constants"
import { useDisclosure } from "@/hooks/use-disclosure"

export function Component() {
	const [opened, { close, set: setMenuOpen }] = useDisclosure(false)

	useEffect(() => {
		document.title = marketingCopy.seo.title

		const description = document.querySelector('meta[name="description"]')
		if (description) {
			description.setAttribute("content", marketingCopy.seo.description)
		}

		const root = document.documentElement
		const reduceMotion = globalThis.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches

		root.classList.add("scrollbar-none")
		if (!reduceMotion) root.classList.add("scroll-smooth")

		return () => {
			root.classList.remove("scrollbar-none", "scroll-smooth")
		}
	}, [])

	return (
		<div className="drawer">
			<input
				id={MARKETING_NAV_ID}
				type="checkbox"
				className="drawer-toggle"
				checked={opened}
				onChange={(event) => setMenuOpen(event.target.checked)}
			/>
			<div className="drawer-content min-h-screen bg-base-100">
				<Navbar />
				<main>
					<HeroSection />
					<FeaturesSection />
					<SecuritySection />
					<FaqSection />
					<CtaSection />
				</main>
				<SiteFooter />
			</div>
			<MarketingDrawer onNavigate={close} />
		</div>
	)
}
