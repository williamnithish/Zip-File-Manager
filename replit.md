# MedCapture — Knowledge Pipeline

A clinical knowledge capture pipeline that converts doctor voice transcripts into validated knowledge graph nodes via LLM extraction, confidence routing, and human-in-the-loop review.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/knowledge-pipeline run dev` — run the frontend (port 19213, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-set by Replit DB)
- Required env: `OPENAI_API_KEY` — for GPT-4o-mini extraction + text-embedding-3-small + Whisper transcription

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + shadcn/ui + Tailwind + wouter + TanStack Query
- AI: OpenAI GPT-4o-mini (extraction), text-embedding-3-small (embeddings), Whisper (transcription)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/openai.ts` — OpenAI client (lazy init), embedding, extraction
- `artifacts/knowledge-pipeline/src/` — React frontend

## Architecture decisions

- **Embeddings as JSON text**: `text-embedding-3-small` vectors stored as JSON-serialized `number[]` in a `text` column. No pgvector extension required; cosine similarity computed in Node.js.
- **Confidence tiers**: HIGH >0.85 (auto-capture + 60s undo window), MEDIUM 0.60–0.85 (confirm/edit/dismiss UI), LOW <0.60 (manual edit required).
- **Conflict types via cosine similarity**: DUPLICATE >0.95, UPDATE 0.85–0.95, COEXIST 0.70–0.85, NEW <0.70.
- **OpenAI lazy init**: `getClient()` in `openai.ts` initializes the client on first call so the server starts without `OPENAI_API_KEY` being set (key only required for actual AI operations).
- **Contract-first**: OpenAPI spec → codegen → typed hooks on frontend and Zod schemas on backend. Never hand-write types that codegen produces.

## Product

- **Dashboard** (`/`): pipeline health at a glance — node counts, today's captures, breakdown by type/department, recent event feed.
- **Pipeline** (`/pipeline`): record or upload audio → Whisper transcription → GPT-4o-mini extraction → tiered review UI (Human-in-loop). HIGH confidence nodes auto-capture with 60s undo. MEDIUM nodes show confirm/edit/dismiss. Conflict detection shows similarity to existing nodes.
- **Knowledge Graph** (`/knowledge`): browse/filter active nodes by type, department, status. Inline editing.
- **Event Log** (`/events`): full audit trail of all pipeline events with metadata.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `OPENAI_API_KEY` must be set as a Replit Secret for extraction, embedding, and transcription to work. Without it the server starts but AI routes return a 500.
- DB schema is managed via `pnpm --filter @workspace/db run push` (dev). Production schema migrations are handled by Replit's Publish flow — never write migration scripts.
- Audio transcription (`POST /api/transcribe`) uses multipart form upload — no generated hook, call with `fetch` + `FormData`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
