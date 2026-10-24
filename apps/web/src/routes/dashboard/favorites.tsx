import VaultBrowser from "@/components/dashboard/vault-browser"

export function Component() {
	return (
		<VaultBrowser
			addLabel="Add item"
			addType="login"
			description="Starred items stay marked on the server."
			emptyBody="Star an item from the vault to keep it here."
			predicate={(item) => item.status === "open" && item.favorite}
			title="Favorites"
		/>
	)
}
