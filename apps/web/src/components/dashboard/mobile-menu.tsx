import { FolderLock, Settings, StickyNote, Zap } from "lucide-react"
import { NavLink } from "react-router"

export default function MobileMenu() {
	return (
		<div className="dock z-30 lg:hidden">
			<NavLink end to="/dashboard">
				<FolderLock className="size-4" />
				<span className="dock-label">Vault</span>
			</NavLink>
			<NavLink to="/dashboard/notes">
				<StickyNote className="size-4" />
				<span className="dock-label">Notes</span>
			</NavLink>
			<NavLink to="/dashboard/password">
				<Zap className="size-4" />
				<span className="dock-label">Generate</span>
			</NavLink>
			<NavLink to="/dashboard/settings">
				<Settings className="size-4" />
				<span className="dock-label">Settings</span>
			</NavLink>
		</div>
	)
}
