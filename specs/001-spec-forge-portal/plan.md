# Implementation Plan: Spec Forge Portal

**Branch**: `001-spec-forge-portal` | **Date**: 2026-03-30 | **Spec**: [spec.md](spec.md)  
**Status**: Planning Phase | **Target Completion**: TBD (4-6 week MVP estimate)

## Summary

Spec Forge Portal is a web-based, spec-driven development (SDD) platform that enables business users to author, refine, and hand off software specifications to developers without IDE/terminal access. Business analysts and product owners create projects, link GitHub repositories, write high-level feature descriptions, and receive AI-generated structured specs (requirements, design, tasks). An interactive clarifying-question workflow refines ambiguous specs. Once approved, specs are automatically synced to multi-repo branches via a GitHub App, with feature status tracked throughout the developer lifecycle. The portal implements BYOK (Bring Your Own Key) LLM integration, role-based access control, and freeze-on-handoff governance to prevent spec drift.

**Core Technical Approach**: Full-stack Next.js application (frontend + backend) with SQLite persistence, GitHub App integration via Octokit, configurable LLM provider gateway (OpenAI/Anthropic), and webhook-driven event processing for repo sync and status updates.

## Technical Context

**Language/Version**: TypeScript (strict mode) with Node.js / Next.js 16  
**Runtime**: Bun (package manager & task runner)  
**Frontend Framework**: React 19 with Next.js App Router (RSC-first)  
**UI Library**: Tailwind CSS v4 + shadcn/ui (Radix primitives)  
**State Management**: Zustand v4 (client-side UI state only); TanStack Query v5 (server data)  
**ORM/Database**: Prisma ORM with SQLite (local file-based, portable)  
**API Integration**: Octokit (GitHub REST API); OpenAI SDK, Anthropic SDK (LLM providers)  
**Auth**: GitHub OAuth (via passport or similar; credentials stored securely)  
**Testing**: Vitest + React Testing Library (unit/component); Playwright (E2E)  
**Linting/Format**: ESLint, Prettier (enforce repo settings)  
**Project Type**: Web application (multi-tenant SaaS portal)  
**Target Platform**: Web (modern browsers; desktop-first for MVP, mobile-responsive as P2)  
**Performance Goals**: Spec generation <5 min; webhook latency <2 min; page load <2 sec; support 100+ concurrent users (MVP)  
**Constraints**: BYOK keys never exposed to browser; all LLM calls server-side; webhook signature verification required; transactional atomicity for critical ops (approve + branch sync)  
**Scale/Scope**: MVP: 1-5 organizations, <50 features/repos per org, <5 concurrent users per org; Growth phase: scale to multi-region as needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Org Principles** (from constitution):
- ✅ **Simplicity First**: Single monolithic Next.js app (no micro-services).
- ✅ **BYOK Security**: Keys encrypted in vault; never exposed to client.
- ✅ **GitHub-Native**: GitHub App + OAuth as primary integration.
- ✅ **Portable Data**: SQLite (local/portable); no hard DB lock-in.
- ✅ **Developer Experience**: Bun + standard Node tooling; no exotic deps.
- ✅ **Type Safety**: TypeScript strict mode; Prisma for schema-driven DB.

**No Violations Detected**: Proposed architecture adheres to all principles.

---

## Project Structure

### Documentation (Feature Artifacts)

```text
specs/001-spec-forge-portal/
├── spec.md                # Feature specification (COMPLETE)
├── plan.md                # This file (IN PROGRESS)
├── research.md            # Phase 0 output (TO DO)
├── data-model.md          # Phase 1 output (TO DO)
├── quickstart.md          # Phase 1 output (TO DO)
├── contracts/             # Phase 1 output: API contracts (TO DO)
│   ├── feature.http       # Feature CRUD endpoints
│   ├── spec-revision.http # Spec generation & approval flow
│   └── github-sync.http   # Branch/PR/webhook operations
└── checklists/
    └── requirements.md    # Spec quality checklist (COMPLETE)
```

### Source Code (Repository Root)

```text
src/
├── app/
│   ├── (auth)/                    # GitHub OAuth flow
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/               # Logged-in portal UX
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project list
│   │   │   ├── [id]/page.tsx     # Project detail
│   │   │   └── new/page.tsx      # Create project
│   │   ├── features/
│   │   │   ├── [featureId]/page.tsx     # Feature detail + spec editor
│   │   │   ├── [featureId]/clarify.tsx  # Clarifying questions UI
│   │   │   └── new/page.tsx             # Create feature
│   │   ├── settings/
│   │   │   ├── llm/page.tsx      # BYOK provider config
│   │   │   ├── templates/page.tsx # Template management
│   │   │   └── rbac/page.tsx     # RBAC groups & permissions
│   │   └── status/[featureId]/page.tsx  # Feature lifecycle view
│   ├── api/
│   │   ├── auth/[...auth]/route.ts       # NextAuth or similar
│   │   ├── features/
│   │   │   ├── route.ts          # POST create, GET list features
│   │   │   ├── [id]/route.ts     # GET/PUT feature detail
│   │   │   ├── [id]/generate/route.ts   # POST trigger spec generation
│   │   │   ├── [id]/approve/route.ts    # POST approve spec
│   │   │   └── [id]/handoff/route.ts    # POST hand off to GitHub
│   │   ├── specs/
│   │   │   ├── [id]/clarify/route.ts    # POST generate clarifying questions
│   │   │   └── [id]/regenerate/route.ts # POST regenerate with answers
│   │   ├── projects/
│   │   │   ├── route.ts          # CRUD projects
│   │   │   ├── [id]/repos/route.ts      # Attach/detach repos
│   │   ├── github/
│   │   │   ├── webhook/route.ts  # POST GitHub webhook events
│   │   │   └── status/route.ts   # GET repo/PR status
│   │   ├── llm/
│   │   │   ├── providers/route.ts # GET/POST LLM provider config
│   │   │   └── keys/route.ts     # PUT save encrypted key
│   │   └── templates/
│   │       └── route.ts          # GET/POST custom templates
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn components (auto-generated)
│   ├── spec-editor/
│   │   ├── spec-editor.tsx       # Markdown editor + preview
│   │   ├── spec-diff.tsx         # Visual diff view
│   │   └── clarity-questions.tsx # Q&A UI (radio/checkbox/text)
│   ├── feature-form/
│   │   ├── create-feature.tsx    # Feature creation form
│   │   └── project-selector.tsx  # Project + repo picker
│   ├── approval-flow/
│   │   ├── approval-status.tsx   # Show current status + reviewers
│   │   ├── approve-button.tsx    # Approve/Request Changes button
│   │   └── comment-section.tsx   # Reviewer comments
│   ├── github-status/
│   │   ├── branch-status.tsx     # Show branch/PR URLs per repo
│   │   ├── sync-result.tsx       # Success/failure summary (best-effort)
│   │   └── webhook-status.tsx    # Real-time webhook event log
│   ├── settings/
│   │   ├── llm-provider-form.tsx # Key entry + provider selection
│   │   ├── template-upload.tsx   # Template file upload
│   │   └── rbac-config.tsx       # Role/approver settings
│   └── dashboards/
│       ├── feature-list.tsx      # Table of features + status
│       └── organization-stats.tsx # Org-wide metrics
├── store/
│   ├── auth-store.ts             # Current user, org context
│   ├── ui-store.ts               # Modal state, selected project, filters
│   └── spec-editor-store.ts      # Editor state (temp answers, draft)
├── hooks/
│   ├── use-feature.ts            # TanStack Query hook: GET feature + specs
│   ├── use-spec-revision.ts      # Query: GET specific spec revision
│   ├── use-approval-status.ts    # Query: GET approval state + reviewers
│   ├── use-github-status.ts      # Query: GET branch/PR status from webhook DB
│   ├── use-clarify-questions.ts  # Query + mutation: GET/POST questions
│   └── use-feature-list.ts       # Query: paginated feature list
├── lib/
│   ├── auth.ts                   # GitHub OAuth helpers
│   ├── env.ts                    # Environment validation (BYOK keys, etc.)
│   ├── utils.ts                  # cn(), formatting helpers
│   ├── db.ts                     # Prisma client singleton
│   ├── crypto.ts                 # KMS-based key encryption/decryption
│   └── validation.ts             # Zod schemas for API requests
├── services/
│   ├── github-app.ts             # Octokit client + GitHub App operations
│   │   ├── createBranch(repo, branchName, baseSha)
│   │   ├── commitFiles(repo, branch, files, message)
│   │   ├── createPullRequest(repo, branch, title, body)
│   │   └── getInstallationToken(orgId, repoName)
│   ├── llm-gateway.ts            # LLM provider abstraction
│   │   ├── selectProvider(orgId, provider?)
│   │   ├── callProvider(prompt, provider, orgId)
│   │   └── generateClarifyingQuestions(spec, orgId)
│   ├── spec-service.ts           # Spec generation & refinement logic
│   │   ├── generateSpec(featureDesc, templateId, orgId)
│   │   ├── regenerateWithAnswers(specId, answers)
│   │   └── lockSpecRevision(specRevId)
│   ├── approval-service.ts       # Approval workflow logic
│   │   ├── requestReview(specId, reviewerIds)
│   │   ├── approveSpec(specId, approverId, threshold)
│   │   └── moveToHandoff(specId)
│   ├── sync-service.ts           # GitHub branch + PR sync
│   │   ├── syncToRepos(specRevId, projectId) → {successes, failures}
│   │   └── recordSyncResult(specRevId, repoId, status, error)
│   └── webhook-service.ts        # GitHub webhook processing
│       ├── handlePROpened(payload) → update status to InProgress
│       └── handlePRMerged(payload) → update status to Complete
├── types/
│   ├── index.ts                  # Shared type exports
│   ├── errors.ts                 # Custom error classes
│   ├── db.ts                     # Prisma-generated types (augmented)
│   └── github.ts                 # GitHub API response types
└── styles/
    ├── globals.css
    └── tailwind.css

prisma/
├── schema.prisma                 # Database schema (entities below)
└── migrations/
    └── [timestamp]_init/         # Auto-generated after first migrate

tests/
├── unit/
│   ├── services/
│   │   ├── approval-service.test.ts
│   │   ├── llm-gateway.test.ts
│   │   └── sync-service.test.ts
│   └── lib/
│       ├── crypto.test.ts
│       └── utils.test.ts
├── integration/
│   ├── github-app.test.ts        # Mock Octokit, test branch/PR creation
│   └── webhook.test.ts           # Parse/verify webhook signature
└── e2e/
    ├── feature-creation.test.ts  # Full workflow: create feature → approve → sync
    ├── clarify-flow.test.ts      # Q&A iteration
    └── status-tracking.test.ts   # Webhook → status update
```

**Structure Decision**: Selected **Single Next.js monolith** (Option 1 variant with API routes). Rationale: MVP scope (1 app, <50 features) does not justify micro-services. Monolith is simpler to deploy, easier to share state (Prisma client, LLM gateway, auth context), and can be scaled horizontally via stateless API (webhooks processed async if needed). Clear separation of concerns via `/api` routes, `/services` business logic, and `/components` UI keeps codebase modular.

---

## Phase 0: Research & Technical Decisions

> **Outcome**: `research.md` with resolutions to unknowns + finalized technical choices.

### Research Tasks

1. **GitHub App Registration & Permissions**  
   - Investigate: Which permissions (refs, content, pull-requests, checks, webhooks) are sufficient for Spec Forge?  
   - Reference: [GitHub App docs](https://docs.github.com/en/apps)  
   - Decision: Document required permissions in `research.md` + provide terraform/curl examples for app creation.

2. **LLM Provider Gateway Architecture**  
   - Investigate: OpenAI API structure (chat completions, token counting, cost). Compare with Anthropic SDK (messages API, token_count header).  
   - Reference: Official SDKs (openai, anthropic packages on npm)  
   - Decision: Design adapter pattern in `llm-gateway.ts` that supports multiple providers. Plan for fallback (if OpenAI unavailable, try Anthropic).

3. **Encryption Strategy for BYOK Keys**  
   - Investigate: Node.js crypto module (AES-256-GCM) vs external KMS (AWS KMS, HashiCorp Vault).  
   - Reference: OWASP key management guidelines; node crypto docs.  
   - Decision: Recommend AES-256-GCM in Node (simple, no external deps for MVP). If enterprise customer, defer to KMS integration notes.

4. **GitHub Webhook Signature Verification**  
   - Investigate: Node.js HMAC-SHA256 verification for GitHub webhook signatures.  
   - Reference: [GitHub Webhook Signature Verification](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks)  
   - Decision: Implement signature check in `/api/github/webhook` before processing any event.

5. **Database Indexing & Query Performance**  
   - Investigate: Prisma + SQLite best practices for common queries (get feature by ID, list features by project, get latest spec revision).  
   - Reference: Prisma docs on indexing; SQLite EXPLAIN QUERY PLAN.  
   - Decision: Document recommended indexes in `schema.prisma` comments. Measure query latency in tests.

6. **Clarifying Questions Generation Strategy**  
   - Investigate: Multi-turn LLM prompting (system prompt + spec + few-shot examples → identify ambiguities).  
   - Reference: OpenAI/Anthropic token counting + prompt engineering examples from Spec Kit docs.  
   - Decision: Design prompt template in `llm-gateway.ts`. Test with 5-10 sample specs to validate question quality.

7. **Feature Status Transitions & Validation**  
   - Investigate: State machine for statuses (Draft → Approved → HandedOff → InProgress → InMerge → Complete). When are transitions invalid?  
   - Decision: Enforce via Prisma middleware or service layer logic. Document state transition rules.

8. **Approval Threshold Configuration**  
   - Investigate: How to store approval config (single approver? unanimous? majority?) per organization in SQLite.  
   - Decision: Add `approvalThreshold` (enum: SINGLE | UNANIMOUS | MAJORITY) + `defaultApproverId` to Organization entity.

---

## Phase 1: Design & Data Model

> **Outcome**: `data-model.md`, `quickstart.md`, `/contracts/*` (API contracts), and updated `agent-context.md` (if applicable).

### 1.1 Data Model Design

**Entities** (from spec, with Phase 0 clarifications integrated):

```prisma
// Represents a customer workspace
model Organization {
  id                String    @id @default(cuid())
  name              String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // BYOK LLM config
  aiSettings        Json      // {defaultProvider: "openai", providers: ["openai", "anthropic"]}
  approvalThreshold String    @default("SINGLE") // SINGLE | UNANIMOUS | MAJORITY
  defaultApproverId String?   // User ID of default approver
  
  // Relations
  members           OrgMember[]
  projects          Project[]
  userKeys          UserKey[]
  templates         SpecTemplate[]
  auditLog          AuditLog[]
  repos            RepoAttachment[]
}

// Organization membership with roles
model OrgMember {
  id            String   @id @default(cuid())
  orgId         String
  userId        String
  role          String   // ADMIN | MEMBER | APPROVER | REVIEWER
  joinedAt      DateTime @default(now())
  
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  @@unique([orgId, userId])
}

// GitHub user (authenticated via OAuth)
model User {
  id            String    @id // GitHub user ID (string)
  username      String    @unique
  email         String?   @unique
  avatarUrl     String?
  githubToken   String    // GitHub personal access token for API calls
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Encrypted LLM API keys
model UserKey {
  id            String    @id @default(cuid())
  orgId         String
  provider      String    // openai | anthropic | google_ai | etc.
  encryptedKey  String    // AES-256-GCM encrypted key
  iv            String    // Initialization vector for decryption
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  @@unique([orgId, provider])
}

// Project groups features and repos
model Project {
  id                String    @id @default(cuid())
  orgId             String
  name              String
  description       String?
  branchPattern     String    @default("spec/{projectKey}/{featureId}-{slug}") // Configurable naming
  projectKey        String    @unique // e.g., SHOP, ACME for branch names
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  organization      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  repos             RepoAttachment[]
  features          Feature[]
  
  @@unique([orgId, projectKey])
}

// Links a GitHub repository to a project
model RepoAttachment {
  id                String    @id @default(cuid())
  projectId         String
  orgId             String
  fullName          String    // owner/repo-name
  defaultBranch     String    @default("main")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organization      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  syncRecords       RepoSyncRecord[]
  
  @@unique([projectId, fullName])
}

// A feature to be specified and implemented
model Feature {
  id                String    @id @default(cuid())
  projectId         String
  title             String
  description       String?   // Initial user description
  status            String    @default("DRAFT") // DRAFT | APPROVED | HANDED_OFF | IN_PROGRESS | IN_MERGE | COMPLETE
  createdBy         String    // User ID
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  completedAt       DateTime?
  
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  specs             SpecRevision[]
  syncRecords       RepoSyncRecord[]
  approvals         SpecApproval[]
}

// Immutable record of a spec version
model SpecRevision {
  id                String    @id @default(cuid())
  featureId         String
  revNumber         Int       @default(1) // r1, r2, r3, etc.
  branchName        String    // e.g., spec/PRJ/123-feature-x or spec/PRJ/123-feature-x-r2
  commitSha         String    // Reference to Git commit containing spec files
  isActive          Boolean   @default(true) // Only latest approved revision is active
  status            String    @default("DRAFT") // DRAFT | APPROVED | HANDED_OFF
  approvedBy        String?   // User ID of approver
  approvedAt        DateTime?
  createdAt         DateTime  @default(now())
  
  feature           Feature   @relation(fields: [featureId], references: [id], onDelete: Cascade)
  answers           ClarifyingAnswer[] // Answers to clarifying questions
  approvals         SpecApproval[]
  syncRecords       RepoSyncRecord[]
  
  @@unique([featureId, revNumber])
  @@index([featureId, isActive])
}

// Stores answers to clarifying questions
model ClarifyingAnswer {
  id                String    @id @default(cuid())
  specRevId         String
  questionNumber    Int       // 1, 2, 3
  question          String
  answer            String    // User's answer or selection
  createdAt         DateTime  @default(now())
  
  spec              SpecRevision @relation(fields: [specRevId], references: [id], onDelete: Cascade)
  
  @@unique([specRevId, questionNumber])
}

// Approval workflow tracking
model SpecApproval {
  id                String    @id @default(cuid())
  specRevId         String
  featureId         String
  requestedBy       String    // User ID who requested review
  assignedTo        String[]  // User IDs of assigned reviewers
  approvedBy        String[]  // User IDs who approved
  rejectedBy        String?   // If rejected, by whom
  comments          String?   // Reviewer feedback
  status            String    @default("PENDING") // PENDING | APPROVED | REJECTED | IN_REVIEW
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  spec              SpecRevision @relation(fields: [specRevId], references: [id], onDelete: Cascade)
  feature           Feature   @relation(fields: [featureId], references: [id], onDelete: Cascade)
  
  @@unique([specRevId])
}

// Tracks where a spec rev has been synced in repos
model RepoSyncRecord {
  id                String    @id @default(cuid())
  specRevId         String
  repoId            String
  featureId         String
  branch            String    // e.g., spec/PRJ/123-feature-x
  commitSha         String?   // SHA of commit with spec files
  prUrl             String?   // Link to PR in this repo
  syncStatus        String    // PENDING | COMMITTED | PR_OPEN | MERGED | FAILED
  errorMessage      String?   // If failed, why
  syncedAt          DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  spec              SpecRevision @relation(fields: [specRevId], references: [id], onDelete: Cascade)
  repo              RepoAttachment @relation(fields: [repoId], references: [id], onDelete: Cascade)
  feature           Feature   @relation(fields: [featureId], references: [id], onDelete: Cascade)
  
  @@unique([specRevId, repoId])
  @@index([featureId, syncStatus])
}

// GitHub webhook events log (for status tracking)
model WebhookEvent {
  id                String    @id @default(cuid())
  featureId         String
  orgId             String
  eventType         String    // pull_request | push | check_run | etc.
  githubPayload     Json      // Full webhook payload for debugging
  status            String    // PULL_REQUEST_OPENED | PULL_REQUEST_MERGED | ERROR
  processedAt       DateTime?
  createdAt         DateTime  @default(now())
}

// Spec templates (org-wide, managed by admins)
model SpecTemplate {
  id                String    @id @default(cuid())
  orgId             String
  name              String    // e.g., "Requirements + Design + Tasks"
  content           String    // Markdown template with [[PLACEHOLDERS]]
  isDefault         Boolean   @default(false)
  isActive          Boolean   @default(true)
  uploadedBy        String    // User ID
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  organization      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  @@unique([orgId, name])
}

// Audit log for compliance
model AuditLog {
  id                String    @id @default(cuid())
  orgId             String
  userId            String
  action            String    // SPEC_CREATED | SPEC_APPROVED | BRANCH_SYNCED | etc.
  resourceType      String    // Feature | SpecRevision | etc.
  resourceId        String
  details           Json?     // Additional context
  timestamp         DateTime  @default(now())
  
  organization      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  @@index([orgId, timestamp])
}
```

### 1.2 API Contracts

Create three contract files in `contracts/`:

- **feature.http**: Feature CRUD, project operations
- **spec-revision.http**: Spec generation, approval, approval workflow
- **github-sync.http**: Branch creation, PR opening, webhook handling

(Full contract details in `contracts/*.http` files — will be generated as separate files during Phase 1 execution.)

### 1.3 Quickstart Guide

Create `quickstart.md` with:
- **Setup**: GitHub App registration, environment variables (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, LLM keys, database)
- **Local dev**: `bun install`, `bunx prisma migrate dev`, `bun run dev`
- **First workflow**: Create org → Create project + link repo → Create feature → Generate spec → Clarify → Approve → Hand off (end-to-end walkthrough)
- **Testing**: Run tests (`bun run test`), E2E tests (`bun run test:e2e`)

---

## Phase 2: Task Breakdown (Executed via `/speckit.tasks`)

> **Status**: Not yet generated. Will produce `tasks.md` with actionable, dependency-ordered tasks.

Expected output: ~40-60 implementation tasks grouped by feature area:
- **Set up**: Project scaffold, GitHub App, env config
- **Auth**: GitHub OAuth middleware
- **Data Layer**: Prisma schema, migrations, queries
- **API Routes**: Feature CRUD, spec generation, approval, GitHub sync
- **Components**: Spec editor, project form, approval UI, settings panels
- **Services**: LLM gateway, GitHub App integration, spec refinement logic
- **Front-end**: Pages, hooks, state management setup
- **Testing**: Unit tests (services), integration tests (GitHub), E2E tests
- **DevOps**: CI/CD pipeline, webhook signature verification

---

## Glossary & Key Decisions

| Term | Definition | Rationale |
|------|-----------|-----------|
| **Active Revision** | Only latest approved SpecRevision with `isActive=true`. Older revisions archived/read-only. | Prevents simultaneous deployment of multiple spec versions in different repos. Simplifies tracking. |
| **Best-Effort Sync** | Multi-repo branch creation continues even if one fails. User sees success/failure summary. | Maximizes availability. Developers can work in successful repos while team resolves failures. |
| **Webhook-Driven Status** | PR open → In Progress (auto). PR merge → Complete (auto). Approvals/handoff remain manual. | Balances developer friction reduction with business control. |
| **Org-Wide Templates** | Only org admins can upload templates. All projects in org share same templates. | Keeps governance simple for MVP. Project-level overrides can be P2. |
| **Single Approver Default** | Default threshold is one authorized "Tech Lead" approval. Orgs can configure to Unanimous or Majority. | Balances speed (MVP) with governance flexibility. |
| **Freeze-on-Handoff** | Once a spec is handed off, it's locked. Only new revisions (r2, r3) can be created; originals immutable. | Prevents drift. Clear contract between business and dev. |

---

## Success Metrics (from Spec)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Spec creation speed** | <15 minutes (description → approved) | User timer + UX testing |
| **Onboarding barrier** | <5 minutes of docs needed | New user walkthrough |
| **Multi-repo sync coverage** | Support 3+ repos simultaneously | Test: create feature → sync to 3 repos |
| **Webhook latency** | <2 minutes (PR merge → Complete status) | Monitor: webhook event time vs DB update time |
| **BYOK security** | 0 key exposures to browser | Code review + security audit |
| **Template flexibility** | Custom templates work end-to-end | Test: upload custom template → generate spec |

---

## Open Questions & Assumptions

| Item | Status | Notes |
|------|--------|-------|
| **GitHub App Registration** | IN PROGRESS | Will finalize in Phase 0 research. Need to document for customers. |
| **LLM Cost Management** | DEFERRED P2 | MVP: track usage only. Later: quotas, rate limiting, cost alerts. |
| **Multi-Tenancy Data Isolation** | ASSUMED ADEQUATE | Org-level isolation via `orgId` FK. Row-level security not needed for MVP. |
| **Automatic Answer Generation during Clarify** | PENDING | Will finalize prompt design in Phase 0. Need examples of good Q&A. |
| **Webhook Retry Logic** | DEFERRED P2 | MVP: process once, log failures. Later: exponential backoff, DLQ. |
| **Offline Support** | OUT OF SCOPE | MVP: assume online. P2: consider sync-on-reconnect. |

---

## Rollout Plan (High-Level)

1. **Weeks 1-2**: Phase 0 research finalization + Prisma schema + GitHub App setup
2. **Weeks 3-4**: Core API routes (feature CRUD, spec generation, LLM gateway)
3. **Weeks 5-6**: GitHub sync service (branch/PR creation, webhook handling)
4. **Weeks 7-8**: Front-end (dashboard, spec editor, clarifying Q UI, approval flow)
5. **Week 9**: Integration testing + security audit (BYOK key handling, webhook signature)
6. **Week 10**: Alpha launch (internal testing) + documentation
7. **Week 11-12**: Beta → GA (customer testing, fixes)

**MVP Target**: 10-12 weeks

(Detailed milestones + resource allocation in separate planning doc.)
