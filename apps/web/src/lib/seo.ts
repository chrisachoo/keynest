import { marketingCopy } from "@/constants"

type PageMeta = {
	description?: string
	title?: string
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
	let element = document.querySelector(`meta[${attribute}="${key}"]`)
	if (!element) {
		element = document.createElement("meta")
		element.setAttribute(attribute, key)
		document.head.appendChild(element)
	}

	element.setAttribute("content", content)
}

export function applyPageMeta({ description, title }: PageMeta = {}) {
	const { seo } = marketingCopy
	const pageTitle = title ?? seo.title
	const pageDescription = description ?? seo.description

	document.title = pageTitle

	setMeta("name", "description", pageDescription)
	setMeta("property", "og:title", pageTitle)
	setMeta("property", "og:description", pageDescription)
	setMeta("name", "twitter:title", pageTitle)
	setMeta("name", "twitter:description", pageDescription)
}
