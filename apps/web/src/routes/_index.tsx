import { useEffect } from "react"
import { useLoaderData } from "react-router"

import CtaSection from "@/components/marketing/cta"
import FaqSection from "@/components/marketing/faq"
import FeaturesSection from "@/components/marketing/features"
import SiteFooter from "@/components/marketing/footer"
import HeroSection from "@/components/marketing/hero"
import Navbar, { MarketingDrawer } from "@/components/marketing/navbar"
import SecuritySection from "@/components/marketing/security"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { marketingCopy } from "@/constants"
import { useDisclosure } from "@/hooks/use-disclosure"
import { fetchApiHealth } from "@/lib/api-health"

export async function loader() {
	return { apiHealth: await fetchApiHealth() }
}

export function Component() {
	const { apiHealth } = useLoaderData<typeof loader>()
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
		<Drawer id="marketing-nav" onOpenChange={setMenuOpen} open={opened}>
			<DrawerContent className="min-h-screen bg-base-100">
				<Navbar />
				<main>
					<HeroSection apiHealth={apiHealth} />
					<FeaturesSection />
					<SecuritySection />
					<FaqSection />
					<CtaSection />
				</main>
				<SiteFooter />
			</DrawerContent>
			<DrawerSide className="z-50" closeLabel="Close menu">
				<MarketingDrawer onNavigate={close} />
			</DrawerSide>
		</Drawer>
	)
}
