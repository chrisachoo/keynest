import { errorMessage } from "@keynest/utils"

import { client } from "@/lib/client"

export async function fetchPrelogin(email: string) {
	const response = await client.auth.prelogin.$post({ json: { email } })
	if (!response.ok) throw new Error(await errorMessage(response))
	return response.json()
}
