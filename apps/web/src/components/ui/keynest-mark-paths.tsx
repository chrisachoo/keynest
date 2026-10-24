export const KEYNEST_BRAND = {
	accent: "#5AE5B2",
	dark: "#00352F",
	fold: "#20B69A",
	light: "#FFFFFF"
} as const

export const KEYNEST_MARK_VIEWBOX = 512
export const KEYNEST_MARK_RADIUS = 112

const MARK_PATHS = {
	foldUnderside:
		"M205 279C229 278 249 289 271 303C310 326 354 344 384 405C354 405 326 396 304 380C282 364 264 338 244 315Z",
	mintArm:
		"M206 254C230 235 254 229 279 235C326 246 363 282 379 329C390 361 390 389 384 405C355 405 326 396 304 380C282 364 264 338 244 315L205 279C196 270 197 261 206 254Z",
	upperArm:
		"M179 244L307 108C313 102 320 98 329 98H371C381 98 384 105 377 113L239 264L190 307V255Z",
	verticalStem:
		"M140 102H174C183 102 190 109 190 118V328C190 365 170 392 143 411L132 419C123 425 116 420 116 410V118C116 109 123 102 132 102Z"
} as const

function MarkGradients({ idPrefix }: Readonly<{ idPrefix: string }>) {
	const bg = `${idPrefix}-bg`
	const stem = `${idPrefix}-stem`
	const mint = `${idPrefix}-mint`
	const fold = `${idPrefix}-fold`

	return (
		<defs>
			<linearGradient
				id={bg}
				x1="80"
				y1="20"
				x2="430"
				y2="500"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset="0" stopColor="#00352F" />
				<stop offset="1" stopColor="#001F1B" />
			</linearGradient>
			<linearGradient
				id={stem}
				x1="130"
				y1="100"
				x2="185"
				y2="390"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset="0" stopColor="#FFFFFF" />
				<stop offset="0.72" stopColor="#FFFFFF" />
				<stop offset="1" stopColor="#E5F0ED" />
			</linearGradient>
			<linearGradient
				id={mint}
				x1="235"
				y1="245"
				x2="370"
				y2="395"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset="0" stopColor="#19AE95" />
				<stop offset="0.55" stopColor="#5AE5B2" />
				<stop offset="1" stopColor="#29C6A2" />
			</linearGradient>
			<linearGradient
				id={fold}
				x1="245"
				y1="290"
				x2="350"
				y2="390"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset="0" stopColor="#139F89" />
				<stop offset="1" stopColor="#20B69A" />
			</linearGradient>
		</defs>
	)
}

function MarkLayers({
	foldFill,
	mintFill,
	stemFill,
	upperFill
}: Readonly<{
	foldFill: string
	mintFill: string
	stemFill: string
	upperFill: string
}>) {
	return (
		<>
			<path d={MARK_PATHS.mintArm} fill={mintFill} />
			<path d={MARK_PATHS.foldUnderside} fill={foldFill} />
			<path d={MARK_PATHS.verticalStem} fill={stemFill} />
			<path d={MARK_PATHS.upperArm} fill={upperFill} />
		</>
	)
}

export function KeynestMarkShapes({
	idPrefix,
	variant
}: Readonly<{ idPrefix: string; variant: "dark" | "light" | "mark" }>) {
	if (variant === "dark") {
		const bg = `${idPrefix}-bg`
		const stem = `${idPrefix}-stem`
		const mint = `${idPrefix}-mint`
		const fold = `${idPrefix}-fold`

		return (
			<>
				<MarkGradients idPrefix={idPrefix} />
				<rect
					width={KEYNEST_MARK_VIEWBOX}
					height={KEYNEST_MARK_VIEWBOX}
					rx={KEYNEST_MARK_RADIUS}
					fill={`url(#${bg})`}
				/>
				<MarkLayers
					mintFill={`url(#${mint})`}
					foldFill={`url(#${fold})`}
					stemFill={`url(#${stem})`}
					upperFill="#FFFFFF"
				/>
			</>
		)
	}

	const tileFill = variant === "light" ? KEYNEST_BRAND.light : "none"

	return (
		<>
			{variant === "light" ? (
				<rect
					width={KEYNEST_MARK_VIEWBOX}
					height={KEYNEST_MARK_VIEWBOX}
					rx={KEYNEST_MARK_RADIUS}
					fill={tileFill}
					stroke="#E5F0ED"
					strokeWidth="4"
				/>
			) : null}
			<MarkLayers
				mintFill={KEYNEST_BRAND.accent}
				foldFill={KEYNEST_BRAND.fold}
				stemFill={KEYNEST_BRAND.dark}
				upperFill={KEYNEST_BRAND.dark}
			/>
		</>
	)
}
