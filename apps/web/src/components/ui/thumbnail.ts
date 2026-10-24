const thumbnailSizes = {
	xs: "size-8",
	sm: "size-10",
	md: "size-12",
	lg: "size-16",
	xl: "size-24"
} as const

const thumbnailShapes = {
	rounded: "rounded-full",
	square: "rounded-xl"
} as const

export { thumbnailShapes, thumbnailSizes }
