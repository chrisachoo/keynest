import type { ReactNode } from "react"
import { useEffect } from "react"

import SiteFooter from "@/components/marketing/footer"
import Navbar, { MarketingDrawer } from "@/components/marketing/navbar"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { useDisclosure } from "@/hooks/use-disclosure"

export default function ToolLayout({
	children,
	description,
	title
}: Readonly<{
	children: ReactNode
	description: string
	title: string
}>) {
	const [opened, { close, set: setMenuOpen }] = useDisclosure(false)

	useEffect(() => {
		document.title = `${title} | Keynest`

		const descriptionMeta = document.querySelector('meta[name="description"]')
		if (descriptionMeta) descriptionMeta.setAttribute("content", description)
	}, [description, title])

	return (
		<Drawer id="marketing-nav" onOpenChange={setMenuOpen} open={opened}>
			<DrawerContent className="flex min-h-screen flex-col bg-base-100">
				<Navbar />
				<main className="mx-auto w-full max-w-5xl flex-1">{children}</main>
				<SiteFooter />
			</DrawerContent>
			<DrawerSide className="z-50" closeLabel="Close menu">
				<MarketingDrawer onNavigate={close} />
			</DrawerSide>
		</Drawer>
	)
}
