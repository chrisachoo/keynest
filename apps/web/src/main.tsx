import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { createBrowserRouter } from "react-router"
import { RouterProvider } from "react-router/dom"

import { routes } from "@/routes"
import { store } from "@/store"

import "./app.css"

const router = createBrowserRouter(routes)
const root = document.getElementById("root")

if (root) {
	ReactDOM.createRoot(root).render(
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	)
}
