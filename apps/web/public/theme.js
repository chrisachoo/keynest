;(function () {
	let theme = localStorage.getItem("vite-ui-theme")
	if (theme !== "sunset") theme = "light"
	let root = document.documentElement
	root.dataset.theme = theme
	root.style.colorScheme = theme === "sunset" ? "dark" : "light"
})()
