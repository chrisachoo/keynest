import { VaultExportSchema } from "@keynest/shared"
import { buildVaultExport, downloadVaultExport, message } from "@keynest/utils"
import { useState } from "react"
import { useRevalidator } from "react-router"
import * as v from "valibot"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { importVaultItems, listVaultItems } from "@/lib/vault-api"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

function ImportVault() {
	const { revalidate } = useRevalidator()
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	return (
		<div className="mt-4 max-w-sm space-y-3">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			{notice ? <p className="text-sm text-success">{notice}</p> : null}
			<Input
				accept="application/json"
				className="file-input px-0"
				disabled={pending}
				onChange={(event) => {
					const file = event.target.files?.[0]
					event.target.value = ""
					if (!file) return
					setPending(true)
					setError(null)
					setNotice(null)
					void file
						.text()
						.then(async (raw) => {
							const parsed = v.parse(VaultExportSchema, JSON.parse(raw))
							const result = await importVaultItems(parsed.items)
							await revalidate()
							setNotice(
								`Imported ${result.imported}. Skipped ${result.skipped} already stored.`
							)
						})
						.catch((cause: unknown) => setError(message(cause)))
						.finally(() => setPending(false))
				}}
				type="file"
			/>
		</div>
	)
}

function ExportVault() {
	const user = useAppSelector(selectUser)
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)

	return (
		<div className="mt-4">
			{error ? <p className="mb-3 text-sm text-error">{error}</p> : null}
			<Button
				disabled={!user || pending}
				onClick={() => {
					if (!user) return
					setPending(true)
					setError(null)
					void listVaultItems()
						.then((items) => downloadVaultExport(buildVaultExport(user, items)))
						.catch((cause: unknown) => setError(message(cause)))
						.finally(() => setPending(false))
				}}
				type="button"
				variant="outline"
			>
				{pending ? "Preparing..." : "Download encrypted export"}
			</Button>
		</div>
	)
}

export default function VaultDataSettings() {
	return (
		<div className="space-y-4">
			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Import</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					Upload an encrypted export from this account. Items stay ciphertext. A
					password change does not require a new export.
				</p>
				<ImportVault />
			</section>

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<h2 className="font-semibold">Export</h2>
				<p className="mt-2 max-w-2xl text-sm text-base-content/70">
					The file contains ciphertext and the wrapped vault key. It still
					requires your password to read.
				</p>
				<ExportVault />
			</section>
		</div>
	)
}
