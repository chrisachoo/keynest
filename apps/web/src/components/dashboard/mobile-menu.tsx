import { FolderLock, Settings, Star, Zap } from "lucide-react"
import { NavLink } from "react-router"

export default function MobileMenu() {
	return (
		<div className="dock z-30 lg:hidden">
			<NavLink end to="/dashboard">
				<FolderLock className="size-4" />
				<span className="dock-label">Vault</span>
			</NavLink>
			<NavLink to="/dashboard/favorites">
				<Star className="size-4" />
				<span className="dock-label">Favorites</span>
			</NavLink>
			<button type="button">
				<Zap className="size-4" />
				<span className="dock-label">Generate</span>
			</button>
			<NavLink to="/dashboard/settings">
				<Settings className="size-4" />
				<span className="dock-label">Settings</span>
			</NavLink>
		</div>
	)
}
