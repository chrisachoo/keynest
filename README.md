# keynest

Private home for your digital keys.

Cloudflare-first monorepo: Hono Worker on D1, Drizzle for schema, Alchemy for deploy. Local tooling uses Bun. React Router lives in `apps/web`.

## Setup

```bash
bun install
cp packages/infra/.env.example packages/infra/.env
cp packages/db/.env.example packages/db/.env
```

## Scripts

- `bun run dev` — Alchemy: API Worker (`http://localhost:8080`) and Vite (`http://localhost:5173`)
- `bun run dev:web` — Vite only, without Alchemy
- `bun run db:generate` — write SQL migrations from the Drizzle schema
- `bun run db:studio` — inspect the local SQLite file
- `bun run check` — Oxlint + Oxfmt (no writes)
- `bun run lint:fix` — apply fixable lint and format
- `bun run deploy` / `bun run destroy` — Alchemy (use `--stage production` for prod)

## API

The Worker mounts `@keynest/api` at `/api`.

- Health: `GET http://localhost:8080/api/health`
- OpenAPI spec: `http://localhost:8080/api/openapi.json`
- Scalar docs: `http://localhost:8080/api/docs`
- v1: `http://localhost:8080/api/v1/...`

Web clients should use Hono RPC against v1:

```ts
import type { ApiType } from "@keynest/api"
import { hc } from "hono/client"

export const client = hc<ApiType>(`${import.meta.env.VITE_SERVER_URL}/api/v1`)
```

Request/response shapes live in `@keynest/shared` (Valibot schemas). Do not duplicate DTOs in the web app.

## Database

One SQLite schema in `packages/db`. The Worker uses the `DB` D1 binding (Alchemy local D1 is already a SQLite file). `DATABASE_URL=file:./local.db` is only for Drizzle Kit. Alchemy applies `packages/db/src/migrations` on deploy.

Vault rows store ciphertext only. Plaintext secrets never belong in this schema.

## Env

Validated with `@t3-oss/env-core` + valibot. Bindings stay on `c.env`. Do not read `process.env` outside `env.ts` files.

## Layout

```
apps/server         Cloudflare Worker entry (CORS, env, mount)
apps/web            React Router + Vite (Alchemy Website)
packages/api        Hono routes, OpenAPI, services
packages/db         Drizzle schema + createDb
packages/shared     Valibot schemas, inferred types, constants
packages/ui         Shared UI (shadcn later)
packages/infra      Alchemy
```
