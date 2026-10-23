import { and, desc, eq, lt, or, vaultItem as vaultItemTable } from "@keynest/db"
import {
	CreateVaultItemSchema,
	UpdateVaultItemSchema,
	VAULT_PAGE_SIZE,
	VaultItemIdParamSchema,
	VaultItemListSchema,
	VaultItemQuerySchema,
	VaultItemSchema
} from "@keynest/shared"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"

import type { ApiEnv } from "../../env"
import { conflict, internalError, notFound } from "../../lib/http"
import {
	jsonContent,
	NOT_FOUND_RESPONSE,
	UNAUTHORIZED_RESPONSE
} from "../../lib/openapi"
import { limitAuthSession } from "../../lib/rate-limit"
import { getAuthUser, requireAuth } from "../../middleware/auth"

function decodeCursor(cursor: string) {
	const split = cursor.lastIndexOf("_")
	if (split <= 0) return null
	const createdAt = new Date(Number(cursor.slice(0, split)))
	const id = cursor.slice(split + 1)
	if (Number.isNaN(createdAt.getTime()) || !id) return null
	return { createdAt, id }
}

function toVaultItem(row: typeof vaultItemTable.$inferSelect) {
	return {
		ciphertext: row.ciphertext,
		createdAt: row.createdAt.toISOString(),
		favorite: row.favorite,
		id: row.id,
		nonce: row.nonce,
		type: row.type,
		updatedAt: row.updatedAt.toISOString(),
		userId: row.userId
	}
}

export const vaultItemRoutes = new Hono<ApiEnv>()
	.use("*", requireAuth, limitAuthSession)
	.get(
		"/",
		describeRoute({
			description:
				"List encrypted vault items for the current user. Ciphertext only — never plaintext secrets.",
			responses: {
				200: jsonContent(VaultItemListSchema, "Vault items"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "List vault items",
			tags: ["Vault items"]
		}),
		validator("query", VaultItemQuerySchema),
		async (c) => {
			const user = getAuthUser(c)
			const query = c.req.valid("query")
			const db = c.get("db")
			const limit = Math.min(
				query.limit ? Number(query.limit) : VAULT_PAGE_SIZE,
				100
			)
			const cursor = query.cursor ? decodeCursor(query.cursor) : null

			const filters = [eq(vaultItemTable.userId, user.id)]
			if (query.type) filters.push(eq(vaultItemTable.type, query.type))
			if (cursor) {
				filters.push(
					or(
						lt(vaultItemTable.createdAt, cursor.createdAt),
						and(
							eq(vaultItemTable.createdAt, cursor.createdAt),
							lt(vaultItemTable.id, cursor.id)
						)
					)!
				)
			}

			const rows = await db
				.select()
				.from(vaultItemTable)
				.where(and(...filters))
				.orderBy(desc(vaultItemTable.createdAt), desc(vaultItemTable.id))
				.limit(limit + 1)

			const page = rows.slice(0, limit)
			const last = page.at(-1)
			const nextCursor =
				rows.length > limit && last
					? `${last.createdAt.getTime()}_${last.id}`
					: null

			return c.json({
				items: page.map(toVaultItem),
				nextCursor
			})
		}
	)
	.post(
		"/",
		describeRoute({
			description:
				"Store a client-encrypted vault item. The server never sees plaintext.",
			responses: {
				201: jsonContent(VaultItemSchema, "Created vault item"),
				401: UNAUTHORIZED_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "Create vault item",
			tags: ["Vault items"]
		}),
		validator("json", CreateVaultItemSchema),
		async (c) => {
			const user = getAuthUser(c)
			const input = c.req.valid("json")
			const db = c.get("db")

			try {
				const [created] = await db
					.insert(vaultItemTable)
					.values({
						ciphertext: input.ciphertext,
						favorite: input.favorite,
						id: input.id,
						nonce: input.nonce,
						type: input.type,
						userId: user.id
					})
					.returning()

				if (!created) throw internalError("Failed to create vault item")
				return c.json(toVaultItem(created), 201)
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("UNIQUE constraint failed")
				)
					throw conflict("Vault item already exists")
				throw error
			}
		}
	)
	.get(
		"/:id",
		describeRoute({
			description: "Fetch one encrypted vault item owned by the current user.",
			responses: {
				200: jsonContent(VaultItemSchema, "Vault item"),
				401: UNAUTHORIZED_RESPONSE,
				404: NOT_FOUND_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "Get vault item",
			tags: ["Vault items"]
		}),
		validator("param", VaultItemIdParamSchema),
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
			description:
				"Update a favorite flag, or replace ciphertext for a vault item. Type cannot change.",
			responses: {
				200: jsonContent(VaultItemSchema, "Updated vault item"),
				401: UNAUTHORIZED_RESPONSE,
				404: NOT_FOUND_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "Update vault item",
			tags: ["Vault items"]
		}),
		validator("param", VaultItemIdParamSchema),
		validator("json", UpdateVaultItemSchema),
		async (c) => {
			const user = getAuthUser(c)
			const { id } = c.req.valid("param")
			const input = c.req.valid("json")
			const db = c.get("db")

			const [updated] = await db
				.update(vaultItemTable)
				.set(
					"favorite" in input
						? { favorite: input.favorite }
						: { ciphertext: input.ciphertext, nonce: input.nonce }
				)
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
				401: UNAUTHORIZED_RESPONSE,
				404: NOT_FOUND_RESPONSE
			},
			security: [{ SessionCookie: [] }],
			summary: "Delete vault item",
			tags: ["Vault items"]
		}),
		validator("param", VaultItemIdParamSchema),
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
