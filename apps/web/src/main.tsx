import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { RouterProvider } from "react-router/dom"

import { router } from "@/routes"
import { store } from "@/store"

import "./app.css"

const root = document.getElementById("root")

if (root) {
	ReactDOM.createRoot(root).render(
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	)
}
