import type { ApiType } from "@keynest/api"
import { hc } from "hono/client"

export type KeynestApiClient = ReturnType<typeof hc<ApiType>>
