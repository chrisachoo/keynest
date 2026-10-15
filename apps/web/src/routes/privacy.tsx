import { Link } from "react-router"

import SiteFooter from "@/components/marketing/footer"
import Logo from "@/components/ui/logo"

export function Component() {
	return (
		<div className="min-h-screen bg-base-100">
			<header className="border-b border-base-300 px-5 py-4">
				<Logo name to="/" />
			</header>
			<main className="mx-auto max-w-2xl space-y-6 px-5 py-12">
				<h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
				<p className="text-base-content/80">
					Keynest stores an account so your vault can sync. The vault contents
					are encrypted in the browser before they are uploaded. The server
					keeps ciphertext, wrapped keys, and an authentication verifier. It
					does not receive your password or the readable secrets inside the
					vault.
				</p>
				<section className="space-y-2">
					<h2 className="text-xl font-semibold">What we store</h2>
					<ul className="list-disc space-y-1 pl-5 text-base-content/80">
						<li>Name, email, and whether that email is confirmed.</li>
						<li>
							A session cookie on the API host, plus the IP address and browser
							string for each session so you can sign a device out.
						</li>
						<li>
							Encrypted vault items, key-derivation parameters, and the wrapped
							vault key.
						</li>
						<li>
							An authenticator secret, encrypted with the server cookie secret,
							if you turn on two-factor authentication. Recovery codes are
							stored only as hashes.
						</li>
					</ul>
				</section>
				<section className="space-y-2">
					<h2 className="text-xl font-semibold">What we do not do</h2>
					<p className="text-base-content/80">
						Keynest does not sell account data, and it does not use vault
						contents for advertising. Email is used to confirm an address or
						finish an email change when delivery is configured.
					</p>
				</section>
				<section className="space-y-2">
					<h2 className="text-xl font-semibold">Your controls</h2>
					<p className="text-base-content/80">
						You can export the encrypted vault, sign out other sessions, change
						your password, and delete the account. Deleting the account removes
						the user, sessions, and vault rows.
					</p>
				</section>
				<p>
					<Link className="link" to="/">
						Back home
					</Link>
				</p>
			</main>
			<SiteFooter />
		</div>
	)
}
