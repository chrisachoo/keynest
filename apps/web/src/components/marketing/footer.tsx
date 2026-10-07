import { Link } from "react-router"

import { marketingCopy } from "@/constants"

import SectionLink from "./section-link"

export default function SiteFooter() {
	const { account, footer, nav } = marketingCopy

	return (
		<footer className="footer footer-center gap-4 border-t border-base-300 bg-base-200 px-5 py-6 text-base-content max-sm:grid-flow-row! sm:footer-horizontal sm:px-8">
			<nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
				{nav.map(({ title, url }) => (
					<SectionLink key={url} href={url} className="link link-hover">
						{title}
					</SectionLink>
				))}
				<Link to={account.signIn.to} className="link link-hover">
					{account.signIn.title}
				</Link>
			</nav>
			<aside>
				<p className="text-sm text-base-content/60">{footer.copyright}</p>
			</aside>
		</footer>
	)
}
