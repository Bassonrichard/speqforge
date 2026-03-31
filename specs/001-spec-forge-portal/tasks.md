# Tasks: SeqForge Portal

**Input**: Design documents from `/specs/001-spec-forge-portal/`  
**Prerequisites**: ✅ spec.md, ✅ plan.md  
**Status**: Ready for implementation  
**Target Duration**: 10-12 weeks (MVP)

## Summary

Break down SeqForge Portal implementation into parallel-able, independently testable tasks organized by user story. Each task targets specific files with clear acceptance criteria.

## Format Reference

- `- [ ] [ID] [P?] [Story] Description with file path`
- **[P]**: Parallelizable (different files, no blocking depenencies on incomplete tasks)
- **[Story]**: User story label, e.g., `[US1]`, `[US2]` (no label = shared infrastructure)
- **File paths**: Exact locations for verification

---

# Phase 1: Setup & Shared Infrastructure (Week 1-2)

**Purpose**: Initialize project structure, databases, auth framework, and shared patterns

**Checkpoint**: All foundation complete before Phase 2 user stories begin

- [X] T001 Initialize Next.js 16 project with TypeScript strict, Tailwind v4, shadcn/ui at repo root
- [X] T002 [P] Create folder structure per plan.md: `src/app`, `src/components`, `src/services`, `src/lib`, `src/types`, `src/hooks`, `src/store`, `prisma/`
- [X] T003 [P] Setup Prisma ORM with SQLite: create `prisma/schema.prisma` with base connection config
- [X] T004 [P] Configure ESLint, Prettier, TypeScript tsconfig.json per AGENTS.md rules
- [X] T005 [P] Setup environment validation: create `src/lib/env.ts` with Zod schema for GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, LLM keys, DATABASE_URL
- [X] T006 [P] Create Prisma client singleton in `src/lib/db.ts` (reusable across server actions/API routes)
- [X] T007 [P] Setup Bun scripts in package.json: `dev`, `build`, `start`, `lint`, `test`, `test:e2e`, `db:migrate`, `db:studio`

---

# Phase 2: Foundational (Blocking Prerequisites) (Week 2-3)

**Purpose**: Core infrastructure ALL user stories depend on

**⚠️ CRITICAL**: No user story work begins until Phase 2 complete

## 2.1 Database Schema & Migrations

- [X] T008 Define complete Prisma schema in `prisma/schema.prisma` with all 13 entities (Organization, User, OrgMember, Project, RepoAttachment, Feature, SpecRevision, ClarifyingAnswer, SpecApproval, RepoSyncRecord, WebhookEvent, SpecTemplate, AuditLog, UserKey) per plan.md data model
- [X] T009 [P] Create Prisma migrations: `bunx prisma migrate dev --name init` to generate initial migration
- [X] T010 [P] Add recommended indexes to schema: (orgId, timestamp) on AuditLog; (featureId, isActive) on SpecRevision; (featureId, syncStatus) on RepoSyncRecord
- [X] T011 Setup SQLite fixture/seed data for testing in `prisma/seed.ts`

## 2.2 Authentication & Authorization

- [X] T012 Implement GitHub OAuth flow: create `src/app/(auth)/login/page.tsx` with GitHub sign-in button
- [X] T013 [P] Create GitHub OAuth callback handler at `src/app/(auth)/callback/route.ts` (exchange code for token, create/update User in DB)
- [X] T014 [P] Implement session middleware in `src/lib/auth.ts`: extract user from GitHub token, validate org membership
- [X] T015 [P] Create RBAC checking utility in `src/lib/rbac.ts`: `isOrgAdmin()`, `isApprover()`, `canApproveSpecs()` (check OrgMember role)
- [X] T016 [P] Setup protected layout at `src/app/(dashboard)/layout.tsx` with session check redirect to login

## 2.3 LLM Gateway & Crypto

- [X] T017 Implement LLM gateway in `src/services/llm-gateway.ts`:
  - `selectProvider(orgId, provider?)` → decrypt key from DB, return configured SDK
  - `callProvider(prompt, provider, orgId)` → call OpenAI or Anthropic SDK with user's key
  - Error handling for rate limits, invalid keys, timeouts
- [X] T018 [P] Implement encryption/decryption in `src/lib/crypto.ts`: AES-256-GCM with Node.js crypto module
  - `encryptKey(plainKey: string): {encryptedKey, iv}`
  - `decryptKey(encryptedKey: string, iv: string): string`
- [X] T019 [P] Create `src/types/errors.ts`: custom error classes (InvalidKeyError, LLMError, SyncError, ValidationError)

## 2.4 GitHub App Integration

- [X] T020 Create GitHub App service in `src/services/github-app.ts`:
  - `getInstallationToken(orgId, repoFullName)` → use octokit App to fetch token per installation
  - `createBranch(token, owner, repo, branchName, baseSha)` → POST /repos/{owner}/{repo}/git/refs
  - `commitFiles(token, owner, repo, branch, files[], message)` → PUT /repos/{owner}/{repo}/contents/{path}
  - `createPullRequest(token, owner, repo, head, base, title, body)` → POST /repos/{owner}/{repo}/pulls
  - `getRepoInfo(token, owner, repo)` → GET repo details (default branch, permissions)
- [X] T021 [P] Setup webhook signature verification in `src/lib/utils.ts`: verify GitHub HMAC-SHA256 signature
- [X] T022 [P] Create GitHub API types in `src/types/github.ts` for common responses (Repository, PullRequest, Ref, etc.)

## 2.5 API Routes & Error Handling

- [X] T023 Create base API error handler: `src/lib/utils.ts` → `ApiError` class, standardized response format {success, data, error}
- [X] T024 [P] Setup API route patterns in `src/app/api/`, all routes validate session before processing
- [X] T025 [P] Create request/response validation schemas in `src/lib/validation.ts` using Zod (FeatureInput, SpecRevisionInput, ApprovalInput, etc.)

## 2.6 Frontend State & Data Fetching

- [X] T026 Setup Zustand store at `src/store/auth-store.ts`: current user, org context, auth status
- [X] T027 [P] Setup Zustand store at `src/store/ui-store.ts`: modal states, selected project filter, toast notifications
- [X] T028 [P] Create TanStack Query hooks in `src/hooks/use-feature.ts`, `use-project.ts`, `use-spec-revision.ts` for server state (caching, invalidation)
- [X] T029 [P] Setup custom error boundary component at `src/components/error-boundary.tsx`
- [X] T030 [P] Create layout wrapper at `src/app/(dashboard)/layout.tsx` with sidebar navigation, user menu

**Checkpoint**: Foundation complete. All 9 user stories can now proceed in parallel.

---

# Phase 3: P1 User Stories (Week 4-6)

## US1: Business User Creates Project and Feature

**Goal**: Non-technical users can create projects, link repos, and start feature specs without CLI access.

**Independent Test**: Create a project, link 1 repo, create a feature. Verify UI shows creation success + feature detail page loads.

### Implementation (T031-T047)

- [X] T031 Create Organization entity if not exists from OAuth callback (first login creates org)
- [X] T032 [P] Implement Project CRUD API routes:
  - POST `src/app/api/projects/route.ts` → create project (name, description, branchPattern, projectKey)
  - GET `src/app/api/projects/route.ts` → list projects for org
  - GET `src/app/api/projects/[id]/route.ts` → get project detail
- [X] T033 [P] Implement RepoAttachment API routes:
  - POST `src/app/api/projects/[id]/repos/route.ts` → attach repo (fullName, defaultBranch)
  - DELETE `src/app/api/projects/[id]/repos/[repoId]/route.ts` → detach repo
- [X] T034 [P] Implement Feature creation API route:
  - POST `src/app/api/features/route.ts` → create feature (projectId, title, description) → save to DB
  - GET `src/app/api/features/route.ts` → list features for org (with filters by projectId, status)
  - GET `src/app/api/features/[id]/route.ts` → get feature detail (include linked repos, spec revisions)
- [X] T035 Create project creation UI component `src/components/feature-form/create-project.tsx` with form (name, repos multi-select from GitHub, branch pattern)
- [X] T036 [P] Create repo link UI component `src/components/feature-form/repo-selector.tsx` with GitHub repo search & fetch
- [X] T037 [P] Create feature creation UI component `src/components/feature-form/create-feature.tsx` with project selector, title, description fields
- [X] T038 [P] Create projects list page `src/app/(dashboard)/projects/page.tsx` with table (name, repos count, features count, actions)
- [X] T039 [P] Create project detail page `src/app/(dashboard)/projects/[id]/page.tsx` with repo links, features list, settings link
- [X] T040 [P] Create features list page `src/app/(dashboard)/features/page.tsx` with filters (project, status), table showing status, created date, last updated
- [X] T041 [P] Create feature detail skeleton at `src/app/(dashboard)/features/[id]/page.tsx` (placeholder for spec editor, will be enhanced in US2)
- [X] T042 Create Zustand hook `src/hooks/use-feature.ts` for TanStack Query GET feature data
- [X] T043 Create TanStack Query hooks `src/hooks/use-project-list.ts`, `use-project-detail.ts` for project queries
- [X] T044 [P] Add audit log entry creation: after project/feature create, call `src/services/audit-service.ts` → log action to AuditLog table
- [X] T045 [P] Unit test `src/services/github-app.ts` → mock Octokit, test getRepoInfo() returns correct shape
- [X] T046 [P] Integration test API routes: POST /api/projects, POST /api/features with valid payloads, verify DB inserts
- [X] T047 [P] E2E test: create project → link repo → create feature, verify feature detail page renders

---

## US2: AI-Assisted Spec Drafting with Templates

**Goal**: Generate structured specs automatically from feature description + org template.

**Independent Test**: Enter feature description, click "Generate Spec", verify markdown output contains sections (User Scenarios, Functional Requirements, Success Criteria, Assumptions).

### Implementation (T048-T064)

- [X] T048 Create spec template management service `src/services/template-service.ts`:
  - `getActiveTemplate(orgId)` → fetch default/active template from SpecTemplate table
  - `getTemplates(orgId)` → list all templates for org
  - `createTemplate(orgId, name, content)` → validate, save to DB
- [X] T049 [P] Implement LLM spec generation service `src/services/spec-service.ts`:
  - `generateSpec(featureDescription, templateId, orgId)` → call llm-gateway with prompt: "Based on this description and template, generate a complete spec with [User Scenarios, FR, SC, Assumptions]"
  - Return structured spec content (string)
  - Save SpecRevision to DB with status=DRAFT
- [X] T050 [P] Create spec generation API route `src/app/api/features/[id]/generate/route.ts` → POST trigger spec generation, return SpecRevision with content
- [X] T051 [P] Implement template upload API route `src/app/api/templates/route.ts` (org admin only):
  - POST → upload Markdown template file, validate placeholders, save to DB
  - GET → list templates for org
- [X] T052 Implement default spec template at `src/lib/DEFAULT_SPEC_TEMPLATE.md` (Requirements + Design + Tasks structure per Spec Kit/Kiro)
- [X] T053 [P] Create spec editor component `src/components/spec-editor/spec-editor.tsx`:
  - Display markdown preview (left) + editor (right) using react-markdown + remark
  - Allow inline edits (optional for MVP)
  - Show status changes
- [X] T054 [P] Create template selector component `src/components/spec-editor/template-selector.tsx` with radio buttons for available templates
- [X] T055 [P] Add spec editor to feature detail page `src/app/(dashboard)/features/[id]/page.tsx`:
  - Show "Generate Spec" button if no SpecRevision exists
  - Show generated spec in editor once SpecRevision created
  - Show "Next" button to proceed to clarifying questions (US3)
- [X] T056 [P] Create LLM error UI component `src/components/spec-editor/llm-error.tsx` with user-friendly message (rate limit, quota, auth issue)
- [X] T057 Create TanStack Query hook `src/hooks/use-spec-revision.ts` → GET SpecRevision by ID, cache
- [ ] T058 [P] Unit test `src/services/spec-service.ts`:
  - Mock llm-gateway, test generateSpec() returns valid SpecRevision
  - Test template placeholder substitution
- [ ] T059 [P] Integration test `src/app/api/features/[id]/generate/route.ts`:
  - POST with valid featureId, verify SpecRevision created in DB
  - Test LLM error handling (mock API error, expect graceful response)
- [ ] T060 [P] Unit test template validation in `src/lib/validation.ts` → required sections detected
- [ ] T061 [P] E2E test: create feature → click "Generate Spec" → wait for response → verify spec editor shows structured content
- [ ] T062 [P] Performance test: measure spec generation latency, target <5 min with typical LLM provider
- [X] T063 Create `src/services/audit-service.ts` utility to log all actions: `logAction(orgId, userId, action, resourceType, resourceId, details)`
- [X] T064 [P] Add fallback template if custom template missing: use DEFAULT_SPEC_TEMPLATE

---

## US3: Interactive Clarifying Questions with Guided Refinement

**Goal**: Identify ambiguities in generated spec, present Q&A UI, regenerate spec with answers.

**Independent Test**: Generate spec → system shows 3 clarifying questions → answer them → spec updates with answers incorporated.

### Implementation (T065-T084)

- [X] T065 Implement clarifying question generation in `src/services/spec-service.ts`:
  - `identifyClarifyingQuestions(spec, orgId)` → call LLM with prompt: "Given this spec, identify 3 key ambiguities or critical decisions that need clarification"
  - Return array of {question: string, options?: [string], type: "radio" | "checkbox" | "text"}
- [ ] T066 [P] Store clarifying questions in memory or temp table (avoid DB for MVP, recompute on demand)
- [X] T067 [P] Create clarifying question API route `src/app/api/features/[id]/clarify/route.ts`:
  - POST → return questions for spec
  - POST `/answer` → save answers as ClarifyingAnswer records, regenerate spec with answers
- [X] T068 Implement spec regeneration in `src/services/spec-service.ts`:
  - `regenerateWithAnswers(specRevId, answers: {[questionNum]: answer})` → call LLM with original spec + answers → update spec content
  - Bump SpecRevision.revNumber if approved, keep as DRAFT until approved
- [X] T069 [P] Create clarifying questions UI component `src/components/spec-editor/clarifying-questions.tsx`:
  - Display one question at a time (or grouped)
  - Radio buttons / checkboxes / text input based on question type
  - Show "Previous" / "Next" navigation
  - Show "Skip" optional button
- [X] T070 [P] Create diff view component `src/components/spec-editor/spec-diff.tsx`:
  - Compare original spec vs updated spec
  - Highlight changes (added/removed/modified sections)
- [ ] T071 Create spec-editor flow state machine in UI:
  - GENERATED → (User clicks "Next") → QUESTIONS_PRESENTED → (User answers) → SPEC_UPDATED → (Loop or Approve)
- [ ] T072 [P] Add clarification UI to feature detail page: show questions after spec generation, allow iteration, show final spec after approval
- [ ] T073 Create TanStack Query hook `src/hooks/use-clarify-questions.ts` → GET questions, POST answers
- [ ] T074 [P] Unit test `src/services/spec-service.ts`:
  - Mock LLM, test identifyClarifyingQuestions() returns 3 questions
  - Test regenerateWithAnswers() updates spec content correctly
- [ ] T075 [P] Integration test clarifying flow:
  - Generate spec → POST /clarify → receive questions → POST answers → GET updated spec
- [ ] T076 [P] E2E test: full spec refinement workflow (answer Q's, see diff, accept, proceed to approval)
- [ ] T077 [P] Error handling: gracefully handle LLM failures during clarification (show retry button)
- [ ] T078 [P] Limit clarifying questions to 3 max (per spec requirement)
- [ ] T079 [P] Implement answer validation: ensure all required questions answered before proceeding
- [ ] T080 Add audit log: log clarifying question answers
- [ ] T081 [P] Implement spec version tracking: each regeneration increments revNumber (draft revisions)
- [ ] T082 [P] Create UI state hook `src/hooks/use-spec-draft-state.ts` for editor state (pending LLM calls, etc.)
- [ ] T083 Test with non-English feature descriptions (if supported by LLM provider)
- [ ] T084 [P] Performance: measure Q&A generation latency, target <5 min total (with clarity iteration)

---

## US4: Multi-Repo Branch and PR Creation

**Goal**: Automatically sync approved specs to multiple GitHub repos as branches + PRs (best-effort).

**Independent Test**: Approve spec → click "Hand Off" → verify branches created in all repos, spec files committed, PRs opened (success/failure summary shown).

### Implementation (T085-T108)

- [X] T085 Implement multi-repo sync service `src/services/sync-service.ts`:
  - `syncToRepos(specRevId, projectId)` → iterate RepoAttachments, attempt branch creation in each
  - For each repo: try creating branch, writing files, opening PR
  - Collect results: {repoId, status, branch, prUrl, error}
  - Return summary: {succeeded: [], failed: [{repoId, error}]}
- [X] T086 [P] Implement branch naming logic: apply branchPattern from Project to generate unique branch names
  - Pattern example: `spec/{projectKey}/{featureId}-{slug}` → `spec/PRJ/123-add-login`
- [X] T087 [P] Create spec files from SpecRevision:
  - `requirements.md` (User Scenarios + FR from spec)
  - `design.md` (if available from spec)
  - `tasks.md` (if available from spec)
  - All files saved to `specs/feature-{ID}/` path in branch
- [X] T088 Implement spec commit service in `src/services/sync-service.ts`:
  - `commitSpecFiles(token, owner, repo, branch, specId, specContent)` → create files in branch, commit with message linking to portal
- [X] T089 [P] Implement PR creation logic: after files committed, create PR with:
  - Title: "Spec: [Feature Name]"
  - Body: Link to portal feature + summary of spec
  - Label (optional): "spec" or "spec-forge"
- [X] T090 Implement handoff API route `src/app/api/features/[id]/handoff/route.ts`:
  - POST → trigger sync to all repos
  - Return sync result: {succeeded: [], failed: []}
  - Update Feature.status → HANDED_OFF
  - Create RepoSyncRecord entries for each repo
- [X] T091 [P] Create sync result UI component `src/components/github-status/sync-result.tsx`:
  - Show table: Repo | Branch | PR URL | Status (✅ / ❌)
  - For failed repos, show error message (e.g., "Branch already exists", "Permission denied")
  - Link to branches/PRs in GitHub
- [ ] T092 [P] Create branch status component `src/components/github-status/branch-status.tsx`:
  - Display per-repo sync status & branch name
  - Show PR links (if opened)
- [ ] T093 Update feature detail page to show sync results after handoff
- [ ] T094 [P] Implement best-effort sync: continue all repos even if one fails
  - Rollback not performed (as per clarification)
  - Partial success is acceptable
- [ ] T095 [P] Error handling in sync service:
  - Catch permission errors, branch exists, network failures
  - Record error in RepoSyncRecord.errorMessage
  - Return to user with clear messaging
- [ ] T096 Create TanStack Query hook `src/hooks/use-github-status.ts` → GET sync status per feature
- [ ] T097 [P] Unit test mock Octokit branch/PR creation, test sync logic with 3+ repos
- [ ] T098 [P] Integration test sync-service: mock octokit, test best-effort (succeed 2 of 3, verify 2 succeed)
- [ ] T099 [P] E2E test: create feature → approve spec → hand off → verify branches in test repos, PRs opened
- [ ] T100 [P] Add audit log: log each handoff action + sync result
- [ ] T101 [P] Lock SpecRevision.isActive after successful handoff
- [ ] T102 [P] Validate branch naming (no invalid characters, max length < 250 chars)
- [ ] T103 [P] Store RepoSyncRecord for audit trail + status dashboard
- [ ] T104 [P] Implement webhook listener for PR events (prepared, not fully used in P1 but foundation for US5)
- [ ] T105 [P] Test with repos using different default branches (main, master, develop)
- [ ] T106 [P] Add config to optionally skip PR creation (branch-only sync)
- [ ] T107 [P] Implement idempotency: if handoff called twice, check if already synced, skip
- [ ] T108 [P] Performance test: measure sync latency for 5+ repos, target <2 min

---

## US5: Feature Status Tracking and Developer Handoff

**Goal**: Track feature lifecycle (Draft → Approved → Handed Off → In Progress → In Merge → Complete). Auto-update via webhooks.

**Independent Test**: Approve feature → hand off → webhook simulated (PR open/merge) → status updates to In Progress / Complete. Verify portal shows correct status.

### Implementation (T109-T128)

- [X] T109 Implement GitHub webhook handler `src/app/api/github/webhook/route.ts`:
  - Verify webhook signature (HMAC-SHA256)
  - Parse payload (event: pull_request, action: opened | closed | edited)
  - Route to appropriate handler
- [X] T110 [P] Implement PR opened handler in `src/services/webhook-service.ts`:
  - Find Feature by branch name (match spec/{projectKey}/{featureId}-*)
  - Set Feature.status = IN_PROGRESS
  - Create WebhookEvent log entry
- [X] T111 [P] Implement PR merged handler:
  - Find Feature by branch name
  - Set Feature.status = COMPLETE (after all repos merged? or first?)
  - Record merge commit SHA
  - Create WebhookEvent log entry
- [X] T112 [P] Create Feature status transition logic in `src/services/approval-service.ts`:
  - Validate transitions: Draft → Approved (manual) → Handed Off (manual) → In Progress (auto) → Complete (auto)
  - Prevent invalid transitions
- [X] T113 Create feature detail page to show current Feature.status prominently:
  - Display status badge (DRAFT / APPROVED / HANDED_OFF / IN_PROGRESS / COMPLETE)
  - Show transition buttons (only valid transitions available)
  - Show approver info (who approved, when)
  - Show handoff info (branch names, PR URLs)
- [X] T114 [P] Add status history/timeline UI: show all status transitions with timestamps
- [X] T115 [P] Create status dashboard component `src/components/dashboards/feature-list.tsx`:
  - Table: Feature | Status | Project | Created | Last Updated | Actions
  - Filter by project, status
  - Sort by created/updated date
- [X] T116 Create status update API:
  - POST `src/app/api/features/[id]/status/route.ts` → validate transition, update status (for manual transitions)
- [X] T117 [P] Implement webhook event processing as background task (for MVP, can be synchronous):
  - POST to /api/github/webhook → parse → update status
  - Error handling: log failures to WebhookEvent table, can retry
  - NOTE: Webhook handlers created in T109-T111, event logging via WebhookEvent table
- [X] T118 Create TanStack Query hook `src/hooks/use-feature-list.ts` with status filter
- [ ] T119 [P] Unit test status transitions: verify valid states, reject invalid
- [ ] T120 [P] Integration test webhook handler:
  - POST simulated GitHub webhook → verify Feature.status updated in DB
  - Test signature verification (valid signature accepted, invalid rejected)
- [ ] T121 [P] E2E test: feature lifecycle (create → approve → hand off → simulate PR open → check status updates)
- [X] T122 Create Feature.completedAt timestamp, set on final merge
- [X] T123 [P] Add audit log entries for all status transitions
- [ ] T124 [P] Implement optional manual status override for admins (in case webhook misses event)
- [ ] T125 [P] Add webhook event retry logic (failed processing, retry up to 3x)
- [ ] T126 [P] Test with multiple repos: feature only moves to COMPLETE after ALL repos' PRs merged
- [ ] T127 [P] Add webhook URL to GitHub App settings documentation
- [ ] T128 [P] Monitor webhook delivery: log all webhook events for admin debugging

---

# Phase 4: P2 User Stories (Week 7)

## US6: Organization-Level BYOK Configuration

**Goal**: Org admins configure LLM provider keys (OpenAI, Anthropic, etc.) or OAuth tokens (GitHub Copilot). Keys encrypted, server-side only.

**Independent Test**: Admin adds OpenAI key → save → generate spec uses that key → verify no key exposure to frontend.

### Implementation (T129-T143)

- [X] T129 Create BYOK settings page `src/app/(dashboard)/settings/llm/page.tsx` (admin-only)
- [X] T130 [P] Create LLM provider selector UI component `src/components/settings/llm-provider-form.tsx`:
  - Dropdown: OpenAI, Anthropic, Google AI, GitHub Copilot (OAuth)
  - Text input (password type) for API key OR OAuth button
  - "Save" / "Connect" button → POST /api/llm/keys or OAuth flow
- [X] T131 Implement LLM key storage API route `src/app/api/llm/keys/route.ts`:
  - PUT → receive provider + plaintext key OR OAuth credentials
  - Encrypt using `src/lib/crypto.ts`
  - Save UserKey record to DB
  - Return masked key (e.g., `sk-...xyz`)
- [X] T132 [P] GET `/api/llm/keys/route.ts` → list configured providers (masked, no actual keys)
- [X] T133 Implement default provider selector UI in settings (radio buttons)
- [ ] T134 Create approver/role selector UI in settings: map users to roles (APPROVER, REVIEWER, MEMBER, ADMIN)
- [X] T135 [P] Update llm-gateway to use org-configured keys:
  - Load key from UserKey table on each call
  - Decrypt in-memory
  - Use with provider SDK
  - Never log or expose plaintext key
- [X] T136 Create settings page authentication guard: verify user is org ADMIN
- [ ] T137 [P] Unit test crypto functions: encrypt → decrypt round-trip, test with various key formats
- [ ] T138 [P] Integration test key storage: POST /api/llm/keys with valid key → verify encrypted in DB, GET returns masked version
- [ ] T139 [P] E2E test: admin saves key → user generates spec → verify spec generation succeeds without key exposure to network
- [ ] T140 Add validation: test LLM keys before saving (make small API call to verify)
- [ ] T141 [P] Add audit log: log all key configuration changes (provider, action: added/updated/removed)
- [ ] T142 [P] Implement key rotation: allow updating key without breaking current operations
- [ ] T143 [P] Add fallback providers: if primary key fails, try secondary configured key (optional P2 enhancement)

---

## US7: Customizable Spec Templates and Org Configuration

**Goal**: Org admins upload custom Markdown templates; all features in org use available templates.

**Independent Test**: Admin uploads custom template → create feature → select custom template → generate spec follows custom structure.

### Implementation (T144-T156)

- [X] T144 Create template management page `src/app/(dashboard)/settings/templates/page.tsx` (admin-only)
- [X] T145 [P] Create template upload UI component `src/components/settings/template-upload.tsx`:
  - File input (Markdown)
  - Template name input
  - "Upload" button → POST /api/templates
- [X] T146 Implement template upload API `src/app/api/templates/route.ts`:
  - POST → receive file, validate placeholders (required: User Scenarios, Functional Requirements, Success Criteria, Assumptions)
  - Save SpecTemplate to DB
  - Activate as current default (optional)
- [X] T147 [P] GET `/api/templates/route.ts` → list all templates for org
- [X] T148 [P] DELETE `/api/templates/[id]/route.ts` → delete template (admin-only, can't delete if active)
- [ ] T149 Create template editor: show template preview before saving
- [X] T150 Create template selector in feature creation flow: radio buttons / dropdown for available templates
- [ ] T151 [P] Update spec-service to apply selected template during generation:
  - Load template content from SpecTemplate
  - Pass to LLM prompt: "Generate spec following this template: [...template placeholders...]"
- [ ] T152 [P] Unit test template validation: check required sections present, reject invalid templates
- [ ] T153 [P] Integration test template upload & generation: upload template → generate spec → verify output follows structure
- [ ] T154 [P] E2E test: admin uploads custom template → user creates feature with custom template → verify spec uses custom sections
- [ ] T155 Add audit log: log template creation/deletion/activation
- [ ] T156 [P] Implement template versioning: allow multiple versions, new features use latest (optional P2 enhancement)

---

## US8: Review and Approval Workflow with RBAC

**Goal**: Non-tech reviewers approve specs before handoff. RBAC enforces roles (approver, reviewer, admin). Configurable approval threshold (single, unanimous, majority).

**Independent Test**: Author requests review → assigned reviewer sees spec → clicks approve → status moves to Approved (with single-approver config).

### Implementation (T157-T179)

- [ ] T157 Create approval workflow UI in feature detail: "Request Review" button → opens dialog to select reviewers
- [ ] T158 [P] Implement approver selection UI component `src/components/approval-flow/reviewer-selector.tsx`:
  - List org members with APPROVER/REVIEWER roles
  - Checkboxes to select multiple reviewers
  - "Request Review" button → POST /api/features/[id]/approve
- [ ] T159 Implement spec approval API route `src/app/api/features/[id]/approve/route.ts`:
  - POST /request-review → create SpecApproval record, set status=IN_REVIEW, assign reviewers
  - POST /approve → called by approver, add to approvedBy list, check threshold
  - POST /reject → called by reviewer, set status=REJECTED, save rejection reason
- [ ] T160 [P] Implement approval threshold logic in `src/services/approval-service.ts`:
  - Get org.approvalThreshold (SINGLE | UNANIMOUS | MAJORITY)
  - Check if approval condition is met:
    - SINGLE: if any APPROVER approved → APPROVED
    - UNANIMOUS: if ALL reviewers approved → APPROVED
    - MAJORITY: if >50% approved → APPROVED
  - Auto-transition Feature.status once condition met
- [ ] T161 [P] Create approval status UI component `src/components/approval-flow/approval-status.tsx`:
  - Show assigned reviewers
  - Show who has approved (with checkmarks)
  - Show approval/rejection buttons (only if assigned to current user)
  - Show comments from reviewers
- [ ] T162 [P] Create reviewer comment UI component `src/components/approval-flow/comment-section.tsx`:
  - Text area for reviewer feedback
  - Saved with approval/rejection
- [ ] T163 Create approval settings page `src/app/(dashboard)/settings/rbac/page.tsx` (admin-only):
  - Approval threshold selector (SINGLE / UNANIMOUS / MAJORITY)
  - Default approver selector (dropdown)
  - Role assignment table (User | Role | Remove)
- [ ] T164 [P] Implement role assignment API `src/app/api/rbac/roles/route.ts`:
  - POST → assign role to user (admin-only)
  - GET → list current role assignments
- [ ] T165 [P] Create RBAC middleware in `src/lib/auth.ts`:
  - `requireRole(role: string)` → middleware for api routes/pages
  - Check OrgMember.role, deny if insufficient
- [ ] T166 [P] Unit test approval threshold logic: test each threshold model with 2/3 approvers
- [ ] T167 [P] Integration test approval flow:
  - Create SpecApproval → assign reviewers
  - Approver calls /approve → check Feature.status transitions based on threshold
- [ ] T168 [P] E2E test: request review → reviewer approves → status moves to Approved (with single-approver mode)
- [ ] T169 Add audit log: log approval requests, approvals, rejections
- [ ] T170 [P] Implement re-request after rejection: allow author to update spec then request review again
- [ ] T171 [P] Add notification (UI toast) when assigned as reviewer
- [ ] T172 [P] Add approval deadline (optional P2): show "approved" expiration window
- [ ] T173 [P] Implement approval bypass for admin (optional): allow admin to force-approve
- [ ] T174 [P] Test with multiple reviewers to verify threshold logic in all modes
- [ ] T175 [P] Add approval history: show all past approvals + rejections for feature
- [ ] T176 [P] Implement pull-request style "request changes" workflow (more nuanced than simple reject)
- [ ] T177 [P] Add batch approval (multiple specs at once) - optional P2
- [ ] T178 [P] Add approval templates: pre-filled approval comments (optional P2)
- [ ] T179 [P] Add approval SLA tracking: measure time to approve (optional P2 metric)

---

## US9: Intelligent Freeze-on-Handoff to Prevent Drift

**Goal**: Once spec handed off, lock it. Create new revisions for changes. Prevent edit drift.

**Independent Test**: Approve spec → hand off → attempt to edit → disabled, error shown. Click "Create New Revision" → r2 created with new branch.

### Implementation (T180-T191)

- [ ] T180 Add isActive + revNumber to SpecRevision. Mark non-active specs as read-only in UI
- [ ] T181 Create freeze logic in `src/services/spec-service.ts`:
  - `lockSpecRevision(specRevId)` → set isActive=false (called after successful handoff)
  - `canEditSpec(specRevId)` → check if spec is active and status != HANDED_OFF
- [ ] T182 Implement spec edit guard in feature detail page:
  - If SpecRevision.isActive=false OR Feature.status=HANDED_OFF → disable edit button, show "Locked" badge
- [ ] T183 [P] Create "Create New Revision" button in feature detail (shown when current spec is locked):
  - Creates new SpecRevision with revNumber + 1
  - New branch name includes revision: e.g., `spec/PRJ/123-feature-x-r2`
  - Status = DRAFT (re-enter approval workflow)
- [ ] T184 Create new revision API route `src/app/api/features/[id]/new-revision/route.ts`:
  - POST → create SpecRevision with next revNumber
  - Return new spec (can regenerate or copy+edit previous)
- [ ] T185 [P] Implement revision history UI component `src/components/spec-editor/revision-history.tsx`:
  - Show all SpecRevisions (r1 [LOCKED], r2 [DRAFT], r3 [ACTIVE], etc.)
  - Show status, approver, date for each
  - Ability to view/compare revisions
- [ ] T186 [P] Prevent app-level edits to locked specs:
  - Disable markdown editor if spec locked
  - Show informational message: "This spec is locked. Create a new revision to make changes."
  - Show link to create new revision
- [ ] T187 [P] Block API calls that would edit locked spec: PUT /api/features/[id]/spec → check isActive, return 403 if locked
- [ ] T188 [P] Unit test freeze logic: can edit active spec, cannot edit locked spec
- [ ] T189 [P] Integration test new revision creation: lock spec r1 → create r2 → verify r2 is active and editable
- [ ] T190 [P] E2E test: approve spec → hand off (locked) → attempt edit (blocked + error message shown) → create new revision r2 → success
- [ ] T191 [P] Add audit log: log spec lock events + new revision creation

---

# Phase 5: Testing & Polish (Week 8-10)

## T192-T210: Comprehensive Testing

- [ ] T192 Unit test coverage target: >=85% for services (approval, sync, spec, auth)
- [ ] T193 [P] Integration test all API routes: CRUD operations, error handling, auth checks
- [ ] T194 [P] E2E test full happy paths:
  - Create feature → generate spec → answer questions → approve → hand off → check status updates
  - (with webhook simulation for status changes)
- [ ] T195 [P] E2E test rollback scenarios:
  - Reject spec approval, re-request review
  - Retry failed repo sync
  - Webhook failure recovery
- [ ] T196 [P] E2E test multi-repo sync: hand off to 3+ repos, verify best-effort (partial success)
- [ ] T197 [P] E2E test RBAC+approval: single approver, unanimous, majority threshold modes
- [ ] T198 [P] Performance testing:
  - Spec generation <5 min
  - Webhook processing <2 min
  - Page load <2 sec  
  - Multi-repo sync <2 min for 5+ repos
- [ ] T199 [P] Security testing:
  - BYOK key never exposed in logs/network
  - Webhook signature verification works
  - RBAC enforced on all admin endpoints
  - XSS protection on user inputs
- [ ] T200 [P] Accessibility testing: keyboard navigation, ARIA labels, contrast (WCAG 2.1 AA)
- [ ] T201 [P] Browser compatibility: test on Chrome, Firefox, Safari (latest 2 versions)
- [ ] T202 [P] Mobile responsiveness: test dashboard on tablet/mobile viewports
- [ ] T203 [P] Error boundary testing: graceful error handling, user-friendly messages
- [ ] T204 [P] Concurrent user testing: 5+ concurrent users creating/approving specs
- [ ] T205 [P] Database query performance: common queries indexed, latency <100ms
- [ ] T206 [P] Webhook reliability: test duplicate/missing/delayed webhook events
- [ ] T207 [P] LLM provider fallback: test primary key failure, fallback to secondary
- [ ] T208 [P] Cleanup/housekeeping: remove test data, verify no data leaks
- [ ] T209 [P] Documentation: API docs (OpenAPI/Swagger), deployment guide, troubleshooting FAQs
- [ ] T210 [P] User acceptance testing (UAT): demo to stakeholders, collect feedback

---

## T211-T220: Deployment & Launch Prep

- [ ] T211 Create `.env.example` with all required variables (GITHUB_APP_ID, LLM keys, DATABASE_URL, etc.)
- [ ] T212 Write deployment documentation: local dev setup, production deployment steps (e.g., via Vercel, self-hosted)
- [ ] T213 [P] Create GitHub App configuration guide: how to register app, install on repos, set webhook URL
- [ ] T214 [P] Setup GitHub Actions CI/CD: lint → test → build → deploy on push to main
- [ ] T215 [P] Create admin onboarding guide: first-time org setup (add users, configure LLM keys, upload templates)
- [ ] T216 [P] Create user onboarding guide: feature creation workflow walkthrough
- [ ] T217 [P] Setup monitoring/logging: error tracking (Sentry?), usage metrics, audit log dashboard
- [ ] T218 [P] Create security checklist: keys encrypted, webhooks verified, sessions tracked, CORS configured
- [ ] T219 [P] Setup feature flags (optional): allow gradual rollout of features
- [ ] T220 [P] Create runbook: incident response, common issues, support contact info

---

## T221-T225: Documentation & Knowledge Transfer

- [ ] T221 Write codebase overview: architecture, key services, data flow diagrams
- [ ] T222 [P] Document all API endpoints: path, method, auth, request/response schema
- [ ] T223 [P] Document database schema: entities, relationships, indexing strategy
- [ ] T224 [P] Create troubleshooting guide: common errors, debugging steps
- [ ] T225 [P] Record demo video: end-to-end workflow (create project → feature → spec → approval → handoff)

---

# Task Dependency Graph

## Critical Path
```
Phase 1 Setup (T001-T007)
    ↓
Phase 2 Foundation (T008-T030)
    ↓
    ├─→ US1 (T031-T047) ─┐
    ├─→ US2 (T048-T064) ─┼─→ US3 (T065-T084)
    ├─→ US4 (T085-T108) ─┤
    ├─→ US5 (T109-T128) ─┤
    ├─→ US6 (T129-T143) ─┤
    ├─→ US7 (T144-T156) ─┤
    ├─→ US8 (T157-T179) ─┤
    └─→ US9 (T180-T191) ─┘
        ↓
Phase 5 Testing (T192-T225)
```

## Parallelizable Stories
- **US1, US6**: Can proceed simultaneously (different features, no cross-dependency)
- **US2, US7**: Can proceed in parallel (both template-related, independent concerns)
- **US3**: Depends on US2 (spec must be generated before clarifying questions)
- **US4**: Depends on US2+US3 (spec approved before handoff)  
- **US5**: Depends on US4 (webhooks for status updates)
- **US8**: Can proceed with US1-US4 (approval flow orthogonal)
- **US9**: Depends on US4 (locking after handoff)

**Recommended Parallelization:**
- Weeks 4-5: US1 (project/feature creation) + US6 (BYOK setup) in parallel
- Weeks 4-6: US2 (spec generation) + US7 (templates) in parallel
- Week 6: US3 (clarifying questions, depends on US2)
- Week 6-7: US4 (handoff, depends on US2+US3) + US8 (approval workflow)
- Week 7: US5 (status tracking, depends on US4) + US9 (freeze, depends on US4)

---

# Success Metrics & Rollout

| Metric | Target | Validation |
|--------|--------|-----------|
| All P1 tasks complete | Week 6 | Code review + E2E tests pass |
| All P2 tasks complete | Week 7 | Integration tests pass |
| Test coverage | >=85% | Coverage report |
| Performance targets | <5 min spec, <2 min webhook | Load tests + monitoring |
| Security audit | Pass | Code review + penetration testing |
| User acceptance | UAT sign-off | Stakeholder feedback |
| Deployment ready | Zero blockers | Checklist complete |

---

# Notes for Execution

1. **Parallel Execution**: US stories (US1-US9) can run in parallel once Phase 2 foundation complete. Coordinate across teams to avoid conflicts.

2. **Testing Strategy**: Write tests FIRST (TDD where possible), especially for services. E2E tests validate entire workflows.

3. **Deployment Gates**: 
   - Alpha (internal): End of Week 10
   - Beta (limited external): End of Week 11
   - GA (general availability): End of Week 12

4. **Risk Areas** (monitor closely):
   - LLM API reliability & cost
   - GitHub webhook delivery guarantees
   - Multi-repo sync partial failure handling
   - SQLite concurrency at scale (>100 users)

5. **Future P2+Enhancements** (out of scope for MVP):
   - Project-level template overrides
   - Advanced webhook retry logic & DLQ
   - Team-level approval workflows (vs org-wide)
   - Slack/email notifications on approval requests
   - Cost tracking + quotas for LLM usage
   - Mobile app support
   - Offline mode with sync-on-reconnect
