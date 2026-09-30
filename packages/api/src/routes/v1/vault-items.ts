import { and, eq, vaultItem as vaultItemTable } from "@keynest/db"
import {
	createVaultItem,
	listVaultItemsQuery,
	updateVaultItem,
	vaultItem,
	vaultItemIdParam,
	vaultItemList
} from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { internalError, notFound } from "../../lib/http"
import {
	jsonContent,
	notFoundResponse,
	unauthorizedResponse
} from "../../lib/openapi"
import { getAuthUser, requireAuth } from "../../middleware/auth"

function toVaultItem(row: typeof vaultItemTable.$inferSelect) {
	return {
		ciphertext: row.ciphertext,
		createdAt: row.createdAt.toISOString(),
		id: row.id,
		nonce: row.nonce,
		type: row.type,
		updatedAt: row.updatedAt.toISOString(),
		userId: row.userId
	}
}

export const vaultItemRoutes = new Hono<ApiEnv>()
	.use("*", requireAuth)
	.get(
		"/",
		describeRoute({
			description:
				"List encrypted vault items for the current user. Ciphertext only — never plaintext secrets.",
			responses: {
				200: jsonContent(vaultItemList, "Vault items"),
				401: unauthorizedResponse
			},
			security: [{ SessionCookie: [] }],
			summary: "List vault items",
			tags: ["Vault items"]
		}),
		validator("query", listVaultItemsQuery),
		async (c) => {
			const user = getAuthUser(c)
			const query = c.req.valid("query")
			const db = c.get("db")

			const items = await db
				.select()
				.from(vaultItemTable)
				.where(
					query.type
						? and(
								eq(vaultItemTable.userId, user.id),
								eq(vaultItemTable.type, query.type)
							)
						: eq(vaultItemTable.userId, user.id)
				)

			return c.json({ items: items.map(toVaultItem) })
		}
	)
	.post(
		"/",
		describeRoute({
			description:
				"Store a client-encrypted vault item. The server never sees plaintext.",
			responses: {
				201: jsonContent(vaultItem, "Created vault item"),
				401: unauthorizedResponse
			},
			security: [{ SessionCookie: [] }],
			summary: "Create vault item",
			tags: ["Vault items"]
		}),
		validator("json", createVaultItem),
		async (c) => {
			const user = getAuthUser(c)
			const input = c.req.valid("json")
			const db = c.get("db")

			const [created] = await db
				.insert(vaultItemTable)
				.values({
					ciphertext: input.ciphertext,
					nonce: input.nonce,
					type: input.type,
					userId: user.id
				})
				.returning()

			if (!created) throw internalError("Failed to create vault item")

			return c.json(toVaultItem(created), 201)
		}
	)
	.get(
		"/:id",
		describeRoute({
			description: "Fetch one encrypted vault item owned by the current user.",
			responses: {
				200: jsonContent(vaultItem, "Vault item"),
				401: unauthorizedResponse,
				404: notFoundResponse
			},
			security: [{ SessionCookie: [] }],
			summary: "Get vault item",
			tags: ["Vault items"]
		}),
		validator("param", vaultItemIdParam),
		async (c) => {
			const user = getAuthUser(c)
			const { id } = c.req.valid("param")
			const db = c.get("db")

			const [row] = await db
				.select()
				.from(vaultItemTable)
				.where(
					and(eq(vaultItemTable.id, id), eq(vaultItemTable.userId, user.id))
				)
				.limit(1)

			if (!row) throw notFound("Vault item not found")

			return c.json(toVaultItem(row))
		}
	)
	.patch(
		"/:id",
		describeRoute({
			description: "Replace ciphertext for a vault item. Type cannot change.",
			responses: {
				200: jsonContent(vaultItem, "Updated vault item"),
				401: unauthorizedResponse,
				404: notFoundResponse
			},
			security: [{ SessionCookie: [] }],
			summary: "Update vault item",
			tags: ["Vault items"]
		}),
		validator("param", vaultItemIdParam),
		validator("json", updateVaultItem),
		async (c) => {
			const user = getAuthUser(c)
			const { id } = c.req.valid("param")
			const input = c.req.valid("json")
			const db = c.get("db")

			const [updated] = await db
				.update(vaultItemTable)
				.set({
					ciphertext: input.ciphertext,
					nonce: input.nonce
				})
				.where(
					and(eq(vaultItemTable.id, id), eq(vaultItemTable.userId, user.id))
				)
				.returning()

			if (!updated) throw notFound("Vault item not found")

			return c.json(toVaultItem(updated))
		}
	)
	.delete(
		"/:id",
		describeRoute({
			description: "Delete a vault item owned by the current user.",
			responses: {
				204: { description: "Deleted" },
				401: unauthorizedResponse,
				404: notFoundResponse
			},
			security: [{ SessionCookie: [] }],
			summary: "Delete vault item",
			tags: ["Vault items"]
		}),
		validator("param", vaultItemIdParam),
		async (c) => {
			const user = getAuthUser(c)
			const { id } = c.req.valid("param")
			const db = c.get("db")

			const [deleted] = await db
				.delete(vaultItemTable)
				.where(
					and(eq(vaultItemTable.id, id), eq(vaultItemTable.userId, user.id))
				)
				.returning({ id: vaultItemTable.id })

			if (!deleted) throw notFound("Vault item not found")

			return c.body(null, 204)
		}
	)
