import { useMemo, useState } from "react"
import { Outlet } from "react-router"

import type { AuthPanelMode } from "@/components/auth/auth-panel"
import AuthShell from "@/components/auth/auth-shell"

export type AuthOutletContext = {
	setPanel: (mode: AuthPanelMode) => void
}

export function Component() {
	const [panel, setPanel] = useState<AuthPanelMode>("default")
	const context = useMemo(() => ({ setPanel }), [setPanel])

	return (
		<AuthShell panel={panel}>
			<Outlet context={context satisfies AuthOutletContext} />
		</AuthShell>
	)
}
