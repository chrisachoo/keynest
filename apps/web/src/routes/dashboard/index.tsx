import { useSearchParams } from "react-router"

import VaultBrowser from "@/components/dashboard/vault-browser"

export function Component() {
	const [params] = useSearchParams()
	const loginsOnly = params.get("view") === "logins"

	return (
		<VaultBrowser
			addLabel={loginsOnly ? "Add login" : "Add item"}
			addType="login"
			description={
				loginsOnly
					? "Logins saved as encrypted vault items."
					: "Logins and secure notes saved as encrypted vault items."
			}
			emptyBody={
				loginsOnly
					? "Add a login to store a username and password in this vault."
					: "Add a login or a secure note. The secret stays inside the encrypted item."
			}
			predicate={(item) => (loginsOnly ? item.type === "login" : true)}
			title={loginsOnly ? "Logins" : "Vault"}
		/>
	)
}
