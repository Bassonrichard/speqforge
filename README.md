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

#### 1. Clone & Install
```bash
git clone https://github.com/your-org/speqforge.git
cd speqforge
bun install
```

#### 2. Create GitHub App for OAuth & Webhooks

**Step 1: Create the GitHub App**
1. Go to **[GitHub Settings → Developer Settings → Apps](https://github.com/settings/apps)**
2. Click **New GitHub App**
3. Fill in the following fields:

| Field | Value |
|-------|-------|
| GitHub App name | `Speqforge` |
| Homepage URL | `http://localhost:3000` |
| Webhook URL | `http://localhost:3000/api/github/webhook` |
| Webhook secret | Generate one: `openssl rand -hex 32` |

**Step 2: Set Up OAuth (Identifying and authorizing users)**
- **Callback URL**: `http://localhost:3000/auth/callback`
- ✅ **Expire user authorization tokens** (enabled)
- ✅ **Request user authorization (OAuth) during installation** (enabled)

**Step 3: Configure Permissions**

Under **Repository permissions**:
- `Contents` → Read & Write (for creating branches, updating files)
- `Pull requests` → Read & Write (for creating/managing PRs)
- `Checks` → Read & Write (for status checks)

Under **Account permissions**:
- `Email addresses` → Read
- `User data` → Read

**Step 4: Subscribe to Webhook Events**
- ✅ `Installation target`
- ✅ `Push`
- ✅ `Pull request`

**Step 5: Installation Settings**
- Select: **Only on this account** (for dev) or **Any account** (for production)

**Step 6: Create the App**
Click **Create GitHub App** and you'll be taken to the app settings page.

#### 3. Get Your Credentials

On the app settings page:
1. **Copy App ID** → Add to `.env.local` as `GITHUB_APP_ID`
2. **Generate Private Key**:
   - Scroll down to "Private keys"
   - Click "Generate a private key"
   - Save the `.pem` file securely
   - Copy its contents to `.env.local` as `GITHUB_OAUTH_CLIENT_SECRET` (base64 encoded)

For OAuth (user login):
1. Find **Client ID** in the app settings → Copy to `NEXT_PUBLIC_GITHUB_CLIENT_ID`
2. Click **Generate a new client secret** → Copy to `GITHUB_OAUTH_CLIENT_SECRET`

#### 4. Configure Environment Variables

Create or update `.env.local`:
```bash
# Database
DATABASE_URL="file:./dev.db"

# GitHub App (from your app settings page)
GITHUB_APP_ID=your-app-id-here
GITHUB_APP_PRIVATE_KEY=your-private-key-pem-contents
GITHUB_APP_WEBHOOK_SECRET=your-webhook-secret-here

# GitHub OAuth (same app)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-client-id-here
GITHUB_OAUTH_CLIENT_SECRET=your-client-secret-here

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=be33a3342959d8cd16cb66fe489e1be6a1c30c20c18f3bbf0c07fe5a682c91f9

# Encryption
ENCRYPTION_KEY=32d330520fb901bc678eec0025b680b35253e28e335952ca78fbfa0922d09723
```

⚠️ **Security Note**: Never commit `.env.local` to git. It's already in `.gitignore`.

#### 5. Initialize Database
```bash
bunx prisma migrate dev
```

#### 6. Run Dev Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) → click **Sign in with GitHub**

#### Testing Your Setup

1. **Login Flow**:
   - Visit http://localhost:3000/login
   - Click "Sign in with GitHub"
   - You'll be redirected to GitHub for authorization
   - After approval, you'll be logged in and redirected to dashboard

2. **Check Logs**:
   - If auth fails, check terminal for error messages
   - Common issues: Missing env vars, incorrect redirect URI, app not installed

3. **Verify Installation**:
   - Go to **[Your GitHub Settings → Applications → Authorized OAuth Apps](https://github.com/settings/applications)**
   - You should see "Speqforge" listed

**Troubleshooting:**
| Error | Solution |
|-------|----------|
| "GitHub OAuth not configured" | Check `NEXT_PUBLIC_GITHUB_CLIENT_ID` in `.env.local` |
| "Invalid client_id" | Verify Client ID matches your app settings |
| "Redirect URI mismatch" | Ensure callback URL is exactly `http://localhost:3000/auth/callback` |
| "Failed to fetch user" | Check `GITHUB_OAUTH_CLIENT_SECRET` is correct and not empty |

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
