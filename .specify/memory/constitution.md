<!--
# SYNC IMPACT REPORT
**Date**: 2026-03-30
**Version Change**: (initial) → 1.0.0
**Amendment Type**: Initial ratification

## Summary
SeqForge Constitution ratified with 5 core principles and governance framework. All placeholders from template filled with project-specific values derived from the 2026 implementation blueprint.

## Core Principles (New)
1. **No-Terminal Portal** — Non-negotiable; business users use web UI only
2. **GitHub-Native Architecture** — Specs live in repos; SQLite stores metadata only
3. **Bring-Your-Own-Key (BYOK) & Provider Agility** — Customer-managed encryption and LLM keys
4. **Immutable Spec Revisions & Gatekeeping** — Non-negotiable; frozen specs + GitHub Checks enforcement
5. **Security-First by Design** — Encryption, sanitization, audit logs, self-hosted option

## Sections Added
- **Technology Stack & Architecture** — Mandatory Next.js/SQLite/Prisma/Octokit stack
- **Data Model & Security** — Table definitions, encryption, compliance requirements
- **Development Workflow & MVP Roadmap** — 5-phase delivery with quality gates and test-first policy

## Governance Enhanced
- Amendment process documented
- Compliance verification procedures defined
- Reference to AGENTS.md, CLAUDE.md, and design templates

## Dependent Templates Status
| Template | Status | Notes |
|----------|--------|-------|
| `plan-template.md` | ✅ Compliant | Already includes Constitution Check gate |
| `spec-template.md` | ✅ Compliant | User story prioritization aligns with principles |
| `tasks-template.md` | ✅ Compliant | Test-first and independent testability built-in |
| Commands (none yet) | N/A | No command files to update |

## Follow-up Items (TODO)
1. **Security Checklist** — Create deployment guide with BYOK setup, prompt injection examples, audit log format (referenced in Governance but not yet written)
2. **LLM Provider TOS Review** — Document compliance requirements for OpenAI, Anthropic, others (in-progress during Phase 2)
3. **GitHub Check Runs Configuration** — Define exact check conditions (spec file presence, approval status) before Phase 4
4. **Encryption Library Selection** — Finalize KMS choice (Node crypto, AWS KMS, or other) during Phase 3 BYOK work
5. **Self-Hosted Deployment Guide** — Prepare optional on-premises setup guide (post-MVP)

## Veracity Check
✅ No unexplained bracket tokens  
✅ Version format correct (1.0.0)  
✅ Dates in ISO format (YYYY-MM-DD)  
✅ Principles declarative and testable (MUST/SHOULD language used)  
✅ Non-negotiable principles clearly marked  
✅ Governance process defined  

## Suggested Commit
```
docs: ratify SeqForge Constitution v1.0.0

Add core principles (No-Terminal Portal, GitHub-Native, BYOK, Immutable Specs, Security-First).
Define technology stack (Next.js 16, SQLite+Prisma, Octokit, GitHub App).
Establish development workflow and MVP roadmap (5 phases, quality gates, test-first).
Document governance, amendment process, and compliance verification.

Fixes: constitution population for project initialization
```
-->

# SeqForge Constitution

## Core Principles

### I. No-Terminal Portal (Non-Negotiable)
Business users interact exclusively with the web-based spec portal. No command-line interface exists for spec authoring. All Git operations (branch creation, file commits, PR opening) are executed server-side by Next.js server actions; users never directly touch the terminal. This principle ensures accessibility: non-technical stakeholders (product managers, business analysts) can author and approve specification documents without Git expertise.

### II. GitHub-Native Architecture
All specification artifacts (requirements.md, design.md, tasks.md) are persisted in GitHub repositories. The SQLite database stores only minimal metadata (feature records, approval history, sync status). Branching, committing, and pull requests are orchestrated via GitHub's REST API (Octokit) using installation tokens from the GitHub App. This principle ensures:
- Specs live alongside code in the same repository system
- Full integration with GitHub's collaboration and approval workflows
- Audit trail inherent to Git commit history
- No redundant file storage (source of truth is GitHub, not duplicate DB storage)

### III. Bring-Your-Own-Key (BYOK) & Provider Agility
Users supply and manage their own API keys for LLM providers (OpenAI, Anthropic, or others). Keys are encrypted at rest using KMS or equivalent; never exposed to the client; always handled server-side. This principle:
- Eliminates vendor lock-in: organizations can switch providers without portal changes
- Ensures BYOK compliance: no model training on customer data by the portal
- Reduces operational cost: no shared LLM infrastructure needed
- Maintains provider relationship: billing and usage tracking stay with the customer

### IV. Immutable Spec Revisions & Gatekeeping (Non-Negotiable)
Once a spec is approved and committed to branches (SpecRevision), that revision is immutable. Any further changes require a new SpecRevision (new branch, new commit). GitHub Check Runs enforce a compliance gate: no code merges without an approved spec present in the branch. This principle ensures:
- Developers always implement and test against a reviewed, stable spec
- No spec drift or surprise requirement changes mid-implementation
- Traceability: every commit links back to its approved spec revision
- Clear handoff: spec is "locked" for development teams to implement

### V. Security-First by Design
All user inputs are sanitized (XSS, injection prevention); LLM outputs are treated as untrusted and validated before commit. API keys are encrypted in motion and at rest. Audit logging tracks all approvals, merges, and key access. Optional self-hosted deployment ensures data residency compliance. This principle covers:
- Prompt injection prevention: inputs/outputs scrubbed before passing to/from LLM
- Encrypted key storage: no plaintext API keys in database or logs
- Compliance controls: audit trail, role-based access, policy enforcement via GitHub Checks
- Data isolation: support for on-premises deployment where no data leaves customer network

## Technology Stack & Architecture

**Mandatory Stack:**
- **Frontend:** Next.js 16 (App Router) with React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js server actions and API routes (no separate microservices)
- **Database:** SQLite with Prisma ORM (or Drizzle as alternative)
- **GitHub Integration:** Octokit for REST API calls; GitHub App for authentication and check runs
- **LLM Integration:** Provider SDKs (OpenAI SDK, Anthropic SDK) called server-side with customer keys
- **Authentication:** GitHub OAuth; no additional SSO needed for MVP

**Architecture Constraints:**
- No monolithic LLM gateway service initially (MVP calls provider SDKs directly)
- All spec content files live in GitHub; database stores metadata only
- No separate frontend/backend; Next.js handles both layers
- Bun as package manager (per AGENTS.md conventions)

## Data Model & Security

**SQLite Tables:**
- `Organization` — customer workspace; holds BYOK settings, templates
- `Project` — product area with 1+ repos and features
- `RepoAttachment` — links GitHub repos to projects
- `Feature` — spec work item; tracks status (Draft → Approved → In Progress → Done)
- `SpecRevision` — immutable snap of a feature spec; contains branch name, commit SHA, approver info
- `RepoSyncRecord` — tracks where a spec revision is synced (which branch, PR URL, status)
- `UserKey` — encrypted API keys; indexed by owner (org or user), provider, and creation date

**Security Requirements:**
1. All API keys encrypted at rest (using Node crypto or external KMS)
2. Keys never sent to client; only used in server actions
3. Prompt sanitization (strip injection attempts via regex/validation)
4. Audit logging for: approvals, merges, key access, user actions
5. GitHub Checks enforce spec presence before merge (gatekeeping)
6. RBAC: only certain GitHub team members can approve specs
7. Optional self-hosted deployment for data residency

## Development Workflow & MVP Roadmap

**Phased Delivery (Target: ~16 developer-weeks, concurrent teams):**

| Phase | Duration | Deliverables | Effort |
|-------|----------|--------------|--------|
| 1. MVPCore | 2 weeks | Next.js setup, GitHub OAuth, project/repo linking, empty branch creation | 4 dev-weeks |
| 2. AI Draft & Q/A | 3 weeks | Spec generation (Codex), clarifying Q/A form, markdown commit | 6 dev-weeks |
| 3. BYOK & Multi-Repo | 4 weeks | Multiple repos per project, encrypted key entry/usage | 8 dev-weeks |
| 4. Workflow & Security | 4 weeks | PR creation, webhook handlers, Check Runs, spec freeze, dashboards | 8 dev-weeks |
| 5. Testing & Launch | 3 weeks | Test suite, security audit, Docker build, documentation, UAT | 5 dev-weeks |

**Quality Gates (Non-Negotiable):**
- All code must pass lint and build checks (0 warnings allowed)
- Integration tests required for API routes and server actions
- Security tests for BYOK, input sanitization, key encryption
- UAT with 1–2 product teams before public rollout

**Test-First Policy:**
- Unit tests for spec generation logic, DB operations, utility functions (≥80% coverage)
- Integration tests for GitHub API calls, workflow end-to-end
- Penetration testing for injection, XSS, secret leakage
- Compliance checks for BYOK TOS alignment

## Governance

**Constitution Supersedes All Other Practices.** This constitution defines non-negotiable principles (Principles I, III, IV, V). All design decisions, PRs, and deployments must comply. Deviations require explicit amendment (see below).

**Amendment Process:**
1. Proposal is documented with rationale and impact analysis
2. Review during a team meeting; discuss risks and benefits
3. If approved, version number increments (MAJOR/MINOR/PATCH per semver rules)
4. All dependent templates (plan, spec, tasks, commands) are reviewed and updated
5. Amendment is merged; commit message cites the principle(s) affected

**Compliance Verification:**
- Design reviews confirm adherence to Principles I–V
- Code reviews check: no CLI for business users, specs in GitHub, keys encrypted, inputs sanitized, tests cover new code
- Sprint retrospectives: flag principle violations and course-correct
- Quarterly audits: verify BYOK compliance, check encryption, review logs

**Guidance & Reference:**
- Runtime development guidance in `AGENTS.md` and `CLAUDE.md` (for developers on this team)
- Design templates in `.specify/templates/` (spec-template, plan-template, tasks-template)
- Security checklist: BYOK setup, prompt injection examples, audit log format (to be detailed in deployment guide)

**Version**: 1.0.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-30
