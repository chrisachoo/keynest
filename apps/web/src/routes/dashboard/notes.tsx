import VaultBrowser from "@/components/dashboard/vault-browser"

export function Component() {
	return (
		<VaultBrowser
			addLabel="Add note"
			addType="secure_note"
			description="Secure notes saved as encrypted vault items."
			emptyBody="Add a note to keep it with your logins. The note text stays inside the encrypted item."
			predicate={(item) => item.type === "secure_note"}
			title="Secure notes"
		/>
	)
}
