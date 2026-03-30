# Spec Forge

A web-based specification authoring platform that integrates AI-assisted drafting, immutable spec revisions, and GitHub-native workflows. Business users author specs via a web UI; developers implement against frozen, approved spec revisions enforced by GitHub Checks.

## Architecture at a Glance

**Stack:**
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + shadcn/ui
- **Backend:** Next.js Server Actions & API routes
- **Database:** SQLite + Prisma ORM
- **GitHub:** Octokit + GitHub App for OAuth, REST API, Check Runs
- **LLM:** Provider SDKs (OpenAI, Anthropic) via BYOK key management
- **Package Manager:** Bun

**Key Principles:**
1. **No-Terminal Portal** — Business users interact exclusively via web UI; all Git operations server-side  
2. **GitHub-Native** — Specs live in repos; SQLite stores metadata only  
3. **BYOK & Provider Agility** — Customer-managed LLM keys; no vendor lock-in  
4. **Immutable Revisions & Gatekeeping** — Frozen specs + GitHub Checks prevent merges without approved spec  
5. **Security-First** — Encrypted keys, sanitized inputs, audit logging, optional self-hosted deployment

See [docs/constitution.md](docs/constitution.md) for full governance and non-negotiable principles.

## Quick Start

### Prerequisites
- Node.js 18+ / Bun
- GitHub account with a registered GitHub App (for OAuth + webhooks)
- SQLite database (auto-initialized)

### Local Development

1. **Clone & install:**
   ```bash
   git clone https://github.com/your-org/speqforge.git
   cd speqforge
   bun install
   ```

2. **Configure environment:**
   Create `.env.local` with:
   ```
   GITHUB_APP_ID=<your-app-id>
   GITHUB_APP_PRIVATE_KEY=<your-private-key>
   GITHUB_OAUTH_CLIENT_ID=<oauth-client-id>
   GITHUB_OAUTH_CLIENT_SECRET=<oauth-secret>
   DATABASE_URL=file:./prisma/dev.db
   ```

3. **Initialize database:**
   ```bash
   bunx prisma migrate dev
   ```

4. **Run dev server:**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Commands
- **Dev:** `bun run dev`
- **Build:** `bun run build`
- **Start:** `bun run start`
- **Lint:** `bun run lint -- --max-warnings=0`
- **Tests:** `bun run test` / `bun run test:e2e`

## Project Structure

```
src/
├─ app/              # Next.js App Router pages & layouts
├─ components/ui/    # shadcn/ui components
├─ lib/              # utilities, auth, Prisma client
├─ services/         # GitHub (Octokit), LLM, Query hooks
├─ store/            # Zustand client state (UI only)
└─ types/            # shared TypeScript interfaces
prisma/
├─ schema.prisma     # data model & migrations
tests/               # unit & E2E test suites
```

## Development Guidelines

- **RSC First:** Use React Server Components by default; `'use client'` only for interactivity, browser APIs, hooks
- **Naming:** kebab-case directories (`spec-editor/`), PascalCase components, camelCase functions
- **State:** Zustand for transient UI state only; TanStack Query v5 for server state; Prisma for DB operations
- **GitHub Integration:** Always use Octokit + installation tokens; never hardcode personal access tokens
- **Security:** Sanitize all user inputs; encrypt API keys server-side; validate LLM outputs before commit
- **Testing:** Unit tests (Vitest + RTL) for 80%+ coverage; E2E (Playwright) for critical flows

See [AGENTS.md](AGENTS.md) for detailed conventions and best practices. See [CLAUDE.md](CLAUDE.md) for agent customization rules.

## Features (MVP Roadmap)

| Phase | Goal | Effort |
|-------|------|--------|
| 1 | Core auth, project setup, empty branch creation | 2 weeks |
| 2 | AI spec draft, Q&A clarification, commit to GitHub | 3 weeks |
| 3 | Multi-repo, BYOK key management, encryption | 4 weeks |
| 4 | PR workflow, Check Runs, spec gatekeeping, dashboards | 4 weeks |
| 5 | Test suite, security audit, Docker, UAT | 3 weeks |

## Security & Compliance

- API keys encrypted at rest; never exposed to client
- GitHub Checks enforce spec approval before merge
- Audit logging for approvals, key access, user actions
- Prompt injection prevention via input sanitization
- Optional self-hosted deployment for data residency

## Contributing

1. Read [AGENTS.md](AGENTS.md) for tech stack rules and conventions
2. Make branches with descriptive names; reference issues
3. Tests must pass: `bun run build && bun run lint && bun run test`
4. PRs require spec approval + code review + passing checks
5. Follow Constitution principles; flag violations in PR discussions

## License

MIT (or as specified in [LICENSE](LICENSE))
