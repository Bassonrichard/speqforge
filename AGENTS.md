<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Architecture and Technology Stack

The entire backend is implemented in **Next.js (App Router)** using **SQLite** with **Prisma**. Authentication is via GitHub OAuth; spec data is persisted in a local SQLite database. All business logic — including LLM calls and GitHub operations — runs in Next.js server components or API routes, eliminating the need for separate services. Prisma schemas define the data model and generate migrations.

**Key components:**
- Next.js pages (React UI)
- Next.js Server Actions/API routes (AI calls, GitHub App logic)
- SQLite database (metadata tracked via Prisma)
- GitHub App (registered in your GitHub account with permissions for refs, content, PRs, and checks)

The GitHub App uses installation tokens for API calls. Webhook routes (e.g., `/api/github/webhook`) handle events like PR merges. All spec content files live in GitHub repos; the SQLite DB tracks only metadata.

**API integrations:**
- GitHub REST API for creating branches, updating files, and opening PRs via **Octokit**
- LLM providers (OpenAI/Anthropic) using their SDKs with customer-supplied keys (BYOK)
- MVP focuses on core Next.js/SQLite architecture; complex features like MCP are deferred

---

## Stack Versions (never deviate)

- **Next.js 16** (App Router only) • **React 19** • **TypeScript strict**
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Zustand v4** with `immer` & `persist` middleware (client UI state only)
- **TanStack Query v5** (server state for all backend data)
- **Prisma ORM** (database schema & migrations)
- **Octokit** (GitHub API client)
- **Bun** for package management and scripts

---

## Commands (Bun)

- **Install**: `bun install`
- **Run**: `bun run dev`
- **Build**: `bun run build`
- **Start**: `bun run start`
- **Lint**: `bun run lint -- --max-warnings=0`
- **Tests**: `bun run test`
- **E2E**: `bun run test:e2e`

---

## Authoring Approach

1. **Think step-by-step first** — outline the solution in detailed pseudocode or bullet steps.
2. **Confirm assumptions only if unclear** — gather necessary context before proceeding.
3. **Generate fully working, secure, performant code** — no TODOs, placeholders, or "left to the reader" statements.
4. **Write only required code** — if nothing changes, reply with "No changes needed."
5. **Keep prose minimal** (≤ 3 explanatory sentences).

---

## Key Principles

| Area | Rule |
|------|------|
| **Router** | Never suggest the legacy *pages* router. App Router only. |
| **RSC First** | Default to React Server Components. Use `'use client'` only for interactivity, browser APIs, event handlers, or hooks. |
| **Readability** | Prefer clear code over micro-optimization; use meaningful names (`specStore`, not `ss`). |
| **Exports** | Use **named exports** everywhere except mandatory default exports in route segment files (`layout.tsx`, `page.tsx`, `route.ts`). |
| **Directories** | kebab-case for folders: `components/spec-editor/`, `services/github-api/`. |
| **Truthfulness** | If a correct answer is uncertain, state that plainly instead of guessing. |
| **No forbidden deps** | Do not introduce Redux/MobX/Recoil, Axios, Moment, MUI/Chakra/Bootstrap/AntD, CSS Modules/styled-components/Emotion, Lodash, Enzyme, Jest. |
| **GitHub Integration** | Use Octokit for all GitHub API calls; manage installation tokens securely via Next.js server context. |
| **Database** | Use Prisma for all DB operations; centralize schema in `prisma/schema.prisma`. |

---

## Folder Layout (generate new files accordingly)

```
src/
├─ app/
│  ├─ (public)/           → marketing pages
│  ├─ (auth)/             → sign-in/up flows
│  └─ (dashboard)/        → logged-in shell
├─ components/
│  └─ ui/                 → shadcn-generated components
├─ store/                 → Zustand stores (flat, domain-based)
├─ hooks/                 → custom React hooks
├─ lib/
│  ├─ auth.ts             → authentication helpers
│  ├─ env.ts              → environment validation
│  ├─ utils.ts            → utility functions (cn, etc.)
│  └─ db.ts               → Prisma client instance
├─ services/
│  ├─ github.ts           → Octokit client & GitHub operations
│  ├─ llm.ts              → LLM provider SDKs
│  └─ query-hooks.ts      → TanStack Query hooks
├─ types/                 → shared TS types & interfaces
└─ styles/                → globals.css, tailwind.css

prisma/
├─ schema.prisma          → Prisma data model
└─ migrations/            → auto-generated migrations

tests/
├─ unit/                  → Vitest unit tests
└─ e2e/                   → Playwright tests
```

---

## Formatting & Linting

- Enforce repo `.editorconfig`, `.prettierrc`, `.eslintrc` — never override.
- Tailwind class order must match `tailwindcss-class-sorter`.
- Group imports: Node → external → internal (absolute `@/…` paths).
- Keep diffs minimal; do not reformat unrelated code.

---

## TypeScript Rules

- **Interfaces over types**; avoid `enum` — use literal unions or lookup maps.
- **`any` forbidden**; use `unknown` with proper narrowing.
- Prefer utility types (`Partial<T>`, `Pick<T, K>`), generics, and `satisfies` for object literals.
- **Functional components only**; annotate props with interfaces.
- Validate API responses with **Zod** schemas before use.

---

## Data Fetching & State

- **No manual `fetch()` calls** in components.
- **All backend data uses TanStack Query v5** hooks (cached, invalidation, retries).
- Centralize query keys (e.g., `['specs', specId, 'details']`).
- **Zustand for transient UI state only** (dialogs, filters, selections); do not store server state in Zustand.
- Use **Prisma queries** in Server Actions or API routes.

---

## UI & Styling (MANDATORY)

- **Tailwind v4 + shadcn/ui only**.
- Generate shadcn components via CLI:
  ```bash
  bun x shadcn@latest init
  bun x shadcn@latest add <component>
  ```
- Import shadcn components **only from `@/components/ui/*`** (no re-implementations).
  - Example: `import { Button } from '@/components/ui/button'`
- Use `cn()` helper for conditional classes; never template-literal concatenation.
- Variants via **CVA** (`class-variance-authority`).
- **Mobile-first responsive** with `sm`, `md`, `lg`, `xl`.
- **Accessibility:** keyboard navigable, correct ARIA labels, focus states, WCAG 2.1 AA contrast.

---

## Testing

- Use **Vitest** + **React Testing Library** for unit/component tests.
- Use **Playwright** for E2E tests (happy path + critical error states for P1 stories when tests are required).
- **Tests must be deterministic** (mock time, stub network, no flaky behavior).
- Ensure the project builds and tests pass before finalizing:
  ```bash
  bun run build
  bun run test
  bun run test:e2e
  ```

---

## GitHub App & Webhooks

- Register your GitHub App in your GitHub account; install it on target repos.
- Store app credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`) as environment variables.
- Use installation access tokens (generated per-installation) for API calls; do not use personal tokens.
- Webhook routes (e.g., `/api/github/webhook`) verify webhook signatures and process events (PR merges, PR opens, etc.).
- All GitHub operations (create branch, update file, open PR) use Octokit with installation tokens.

---

## Database & Migrations

- Use **Prisma ORM** for all DB schema and operations.
- Define all tables in `prisma/schema.prisma`.
- Generate migrations:
  ```bash
  bunx prisma migrate dev --name <migration_name>
  ```
- Apply migrations in production via CI/CD or deployment hooks.
- Use Prisma client as a singleton in `src/lib/db.ts`.
- **Bun + SQLite**: Use `@prisma/adapter-libsql` for SQLite support (Bun doesn't support better-sqlite3's native driver).

### Prisma Best Practices

**JSON Fields:**
- Always use `JSON.stringify()` when writing to JSON/Json fields
- Use `undefined` (not `null`) for optional JSON fields to avoid Prisma type errors
- Example: `details: entry.details ? JSON.stringify(entry.details) : undefined`

**Relations & Includes:**
- Only include relations that exist in your Prisma schema (check `prisma/schema.prisma`)
- Use `include` for related data, `select` to limit fields
- Validate relation names match schema exactly before using in queries

**Type Safety:**
- Import types from `@prisma/client` for function parameters
- Use Prisma's generated types (e.g., `SpecRevision`, `Feature`) for consistency
- Leverage TypeScript's type checking to catch schema mismatches early

**Error Handling:**
- Wrap all DB operations in try-catch blocks
- Log errors but don't expose internal DB details to clients
- For audit logging, continue execution even if audit write fails

**Query Patterns:**
- Use `findUnique` with unique constraints (id, unique indexes)
- Use `findFirst` when you need one result but don't have a unique constraint
- Use `findMany` with `take` and `skip` for pagination
- Use `include` sparingly—only load relations you actually need

---

## LLM Integration

- Call LLM providers (OpenAI, Anthropic, etc.) via their official SDKs.
- Store API keys as environment variables (customer-supplied BYOK).
- Use Server Actions or API routes for LLM calls; never expose keys to the browser.
- Validate and sanitize user input before sending to LLM.
- Handle LLM errors gracefully (rate limits, timeouts, invalid requests).

---

## Professional Conduct for Code Generation

Act like a helpful assistant who is a **highly experienced TypeScript engineer** with broad experience in LLM-assisted development, rigorously upholding:

- **Integrity**: Never distort, omit, or manipulate information.
- **Evidence-Based**: Ground statements in verifiable evidence from tool results or user input.
- **Neutrality**: Maintain strict impartiality; rely on data.
- **Discipline of Focus**: Stay aligned with the user's task; avoid unrelated topics.
- **Clarity**: Use precise technical language.
- **Thoroughness**: Do not overlook important edge cases or constraints.
- **Step-by-Step Reasoning**: Break down complex work into clear, logical steps.
- **Continuous Improvement**: Ask for feedback when requirements are ambiguous and iterate.
- **Tool Utilization**: Leverage available tools effectively; critically evaluate outputs.
