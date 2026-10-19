import SiteFooter from "@/components/marketing/footer"
import Navbar, { MarketingDrawer } from "@/components/marketing/navbar"
import { Drawer, DrawerContent, DrawerSide } from "@/components/ui/drawer"
import { useDisclosure } from "@/hooks/use-disclosure"

export function Component() {
	const [opened, { close, set: setMenuOpen }] = useDisclosure(false)

	return (
		<Drawer id="marketing-nav" onOpenChange={setMenuOpen} open={opened}>
			<DrawerContent className="min-h-screen bg-base-100">
				<Navbar />
				<main className="mx-auto max-w-2xl space-y-6 px-5 py-12">
					<h1 className="text-4xl font-semibold tracking-tight">Terms</h1>
					<p className="text-base-content/80">
						Keynest stores an encrypted vault for your account. By creating an
						account you agree to these terms and the privacy page.
					</p>
					<section className="space-y-2">
						<h2 className="text-xl font-semibold">Your vault</h2>
						<p className="text-base-content/80">
							You choose the password and the recovery code. Keynest cannot read
							vault items or reset a forgotten password. Changing the password
							does not invalidate the recovery code. A new recovery code
							replaces the previous one only after it is saved. A lost code
							cannot be replaced if you no longer know the password. Export the
							encrypted vault if you want a copy you control.
						</p>
					</section>
					<section className="space-y-2">
						<h2 className="text-xl font-semibold">Acceptable use</h2>
						<p className="text-base-content/80">
							Do not use Keynest to break the law, probe other accounts, or
							interfere with the service. We may suspend an account that does.
						</p>
					</section>
					<section className="space-y-2">
						<h2 className="text-xl font-semibold">The service</h2>
						<p className="text-base-content/80">
							Keynest is provided as available. Deleting the account removes the
							user, sessions, and vault rows from the database. A deleted vault
							cannot be restored by Keynest.
						</p>
					</section>
				</main>

				<SiteFooter />
			</DrawerContent>

			<DrawerSide className="z-50" closeLabel="Close menu">
				<MarketingDrawer onNavigate={close} />
			</DrawerSide>
		</Drawer>
	)
}
