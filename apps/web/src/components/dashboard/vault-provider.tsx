import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode
} from "react"

import {
	VaultContext,
	type OpenVaultItem,
	type TamperedVaultItem,
	type VaultContextValue,
	type VaultItemView
} from "@/components/dashboard/vault-context"
import {
	bootVault,
	draftPayload,
	lockVault,
	openPayload,
	persistVault,
	sealPayload,
	startVaultSession,
	type StoredVaultItem,
	type VaultDraft,
	type VaultPayload
} from "@/components/dashboard/vault-session"

type UnlockedSession = {
	items: VaultItemView[]
	key: CryptoKey
	keyId: string
	notice: string | null
	records: StoredVaultItem[]
	status: "unlocked"
}

type VaultSession =
	| { status: "loading" }
	| { itemCount: number; status: "locked" }
	| UnlockedSession

async function revealRecords(key: CryptoKey, records: StoredVaultItem[]) {
	const items = await Promise.all(
		records.map(async (record) => {
			try {
				const payload = await openPayload(key, record)
				return {
					createdAt: record.createdAt,
					id: record.id,
					name: payload.name,
					secret: payload.secret,
					status: "open",
					type: payload.type,
					updatedAt: record.updatedAt,
					username: payload.username
				} satisfies OpenVaultItem
			} catch {
				return {
					createdAt: record.createdAt,
					id: record.id,
					status: "tampered",
					type: record.type,
					updatedAt: record.updatedAt
				} satisfies TamperedVaultItem
			}
		})
	)

	return items.toSorted((left, right) =>
		right.updatedAt.localeCompare(left.updatedAt)
	)
}

export function VaultProvider({ children }: Readonly<{ children: ReactNode }>) {
	const [session, setSession] = useState<VaultSession>({ status: "loading" })
	const [composerOpen, setComposerOpen] = useState(false)
	const [composerType, setComposerType] =
		useState<VaultPayload["type"]>("login")
	const sessionRef = useRef(session)
	const generation = useRef(0)
	const queue = useRef(Promise.resolve())

	useEffect(() => {
		sessionRef.current = session
	})

	useEffect(() => {
		let cancelled = false

		bootVault()
			.then(async (result) => {
				if (cancelled) return
				if (result.status === "locked") {
					setSession(result)
					return
				}

				const items = await revealRecords(result.key, result.records)
				if (cancelled) return

				setSession({
					items,
					key: result.key,
					keyId: result.keyId,
					notice: result.notice,
					records: result.records,
					status: "unlocked"
				})
			})
			.catch(() => {
				if (!cancelled) setSession({ itemCount: 0, status: "locked" })
			})

		return () => {
			cancelled = true
		}
	}, [])

	const replaceRecords = useCallback(
		async (current: UnlockedSession, records: StoredVaultItem[]) => {
			const stamp = generation.current
			const items = await revealRecords(current.key, records)
			if (stamp !== generation.current) return

			persistVault(current.keyId, records)
			const next: UnlockedSession = {
				...current,
				items,
				notice: null,
				records
			}
			sessionRef.current = next
			setSession(next)
		},
		[]
	)

	const enqueue = useCallback((task: () => Promise<void>) => {
		const run = queue.current.then(task, task)
		queue.current = run
		return run
	}, [])

	const saveItem = useCallback(
		async (draft: VaultDraft) => {
			await enqueue(async () => {
				const current = sessionRef.current
				if (current.status !== "unlocked") return
				const record = await sealPayload(
					current.key,
					crypto.randomUUID(),
					draftPayload(draft)
				)
				await replaceRecords(current, [record, ...current.records])
			})
		},
		[enqueue, replaceRecords]
	)

	const removeItem = useCallback(
		(id: string) => {
			void enqueue(async () => {
				const current = sessionRef.current
				if (current.status !== "unlocked") return
				await replaceRecords(
					current,
					current.records.filter((record) => record.id !== id)
				)
			})
		},
		[enqueue, replaceRecords]
	)

	const lock = useCallback(() => {
		const current = sessionRef.current
		if (current.status !== "unlocked") return
		generation.current += 1
		lockVault()
		setComposerOpen(false)
		const next = {
			itemCount: current.records.length,
			status: "locked" as const
		}
		sessionRef.current = next
		setSession(next)
	}, [])

	const startSession = useCallback(async () => {
		generation.current += 1
		const created = await startVaultSession()
		const next: UnlockedSession = {
			items: [],
			key: created.key,
			keyId: created.id,
			notice: null,
			records: [],
			status: "unlocked"
		}
		sessionRef.current = next
		setSession(next)
	}, [])

	const openComposer = useCallback((type: VaultPayload["type"] = "login") => {
		if (sessionRef.current.status !== "unlocked") return
		setComposerType(type)
		setComposerOpen(true)
	}, [])

	const closeComposer = useCallback(() => {
		setComposerOpen(false)
	}, [])

	const value = useMemo<VaultContextValue>(
		() => ({
			closeComposer,
			composerOpen,
			composerType,
			items: session.status === "unlocked" ? session.items : [],
			lock,
			notice: session.status === "unlocked" ? session.notice : null,
			openComposer,
			removeItem,
			saveItem,
			sessionCount:
				session.status === "locked"
					? session.itemCount
					: session.status === "unlocked"
						? session.records.length
						: 0,
			startSession,
			status: session.status
		}),
		[
			closeComposer,
			composerOpen,
			composerType,
			lock,
			openComposer,
			removeItem,
			saveItem,
			session,
			startSession
		]
	)

	return <VaultContext value={value}>{children}</VaultContext>
}
