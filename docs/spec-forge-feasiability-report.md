# Spec Forge Feasibility and Build Plan for BYOK Spec-Driven Development

## Tool landscape and what it implies for Spec Forge

Spec-driven development (SDD) is still a moving target in terms of terminology, but the common thread across the ecosystem is consistent: create a structured, behavior-oriented "spec" in natural language before implementation, and treat that spec as the persistent source of truth that both humans and coding agents refer to (and update) over time. Industry leaders characterize a spec as a structured, behavior-oriented artifact (or set of artifacts) that guides AI coding agents, and notes that different tools vary by spec structure, level of detail, and how those artifacts are organized.

Across the tools you listed, there is a clear convergence on a staged flow with explicit checkpoints:

- **Spec creation** (business intent, constraints, acceptance criteria)
- **Planning** (technical decomposition and architecture decisions)
- **Task breakdown** (actionable steps for execution)
- **Implementation and verification** (with human review gates)

For example, Spec Kit explicitly frames SDD as making specifications “executable” and emphasizes multi-step refinement rather than one-shot prompt-to-code workflows. citeturn3view0turn3view1turn9view2 Its recommended agent workflow is a simple command progression: `/specify` to generate a full spec from a high-level prompt, `/plan` to create a technical implementation plan, and `/tasks` to break the work into actionable tasks. citeturn2view2

Kiro operationalizes a very similar idea with a crisp artifact structure and a three-phase workflow, where each spec generates `requirements.md` or `bugfix.md`, `design.md`, and `tasks.md`, and then provides an interface for tracking task execution state. citeturn2view1

OpenSpec intentionally takes a different stance: it positions itself as lightweight, open source, universal, and explicitly “No API Keys” and “No MCP,” with native integrations across many assistants (including GitHub Copilot, Claude Code, OpenCode, and others). citeturn2view0

Traycer, in contrast, is productized around orchestrating the plan-execute-verify cycle inside IDE surfaces, with “one click hand-off” to other agents and verification scanning to reduce drift. citeturn10view0turn2view3

The key implication for your vision is that you are not trying to invent SDD. You are targeting a specific adoption bottleneck: shifting the spec and sign-off workflow out of IDE and terminal surfaces so product and business stakeholders can participate without becoming “tool users” first, while still outputting artifacts that developers can consume in their existing agent workflows.


## Feasibility of a BYOK-first, non-IDE spec workflow

From a pure capability standpoint, your plan is feasible because the two hard integration points are both well-supported in today’s tooling:

- Writing and versioning structured specs as files (Markdown or similar) is a first-class fit for Git workflows and is already the idiom used by Spec Kit, Kiro specs, and OpenSpec.
- Repository automation and status tracking can be reliably implemented using a GitHub App, GitHub webhook subscriptions, and the GitHub REST API for branches, refs, and pull requests.

The higher-risk part is not “can you do it,” but “can you do it safely and in a way that matches BYOK expectations.”

### What BYOK can mean in practice

In this ecosystem, BYOK is being implemented in at least three distinct ways:

- **User supplies API key(s) to a tool which then routes provider billing directly to the user’s provider account.** OpenCode Zen describes this explicitly: you can use your own OpenAI or Anthropic API keys, and when you do, tokens are billed directly by the provider, not by Zen. citeturn2view4 OpenCode also models roles where members manage their own keys and admins can manage members, keys, billing, and set spending limits. citeturn2view4
- **Enterprise config supplies API keys to an internal platform feature.** GitHub Copilot now supports “bring your own API keys” for custom models in public preview, letting enterprise owners add keys for providers including Anthropic, OpenAI, Google AI Studio, AWS Bedrock, and others, and then expose those models to members in Copilot Chat. citeturn5view0
- **Gateway-level BYOK that scopes credentials at a team boundary and applies them transparently.** Vercel AI Gateway documents BYOK as using your own credentials with no added markup, scoped to the Vercel team and reusable across multiple projects, and it also describes fallback to system credentials if BYOK credentials fail. citeturn2view5

These patterns are all compatible with your vision, but they imply different product decisions.

### Key constraint: API key safety and policy expectations

If you make business users paste API keys into a web portal, you are accepting a meaningful security and governance burden.

OpenAI's published guidance is very direct: do not deploy API keys in client-side environments like browsers, route requests through your backend, and sharing API keys is against the Terms of Use. That pushes Spec Forge toward one of these deployment postures:

- **Single-tenant or self-hosted inside the organization’s infrastructure** (keys never leave the org boundary).
- **Multi-tenant SaaS with strong key isolation and enterprise security controls** (KMS, strict RBAC, audit, incident response), plus clear customer responsibility boundaries.

If BYOK is non-negotiable, you should treat “key custody model” as a first-tier architectural decision, not an implementation detail.

### Addressing the “no terminal for business users” barrier

Your core problem statement aligns with what enterprise-oriented SDD adoption guidance highlights: SDD adoption requires integration with existing workflows and improved stakeholder collaboration, not just a better prompt loop. Industry analysis emphasizes that at enterprise scale, current SDD tools have gaps and that adoption requires workflow integration and stakeholder collaboration changes to be sustainable.

There is also evidence from existing tool ergonomics that your “web portal” direction is addressing a real seam:

- Spec Kit is fundamentally CLI-first (`specify`), but it already has ecosystem movement toward "visual orchestrators," such as a VS Code extension that provides workflow orchestration and phase status visualization, while still requiring the CLI.
- Traycer's onboarding assumes IDE extensions and "open traycer from your IDE," which is directly at odds with business-side accessibility.
- Kiro's specs are presented as an IDE workflow with a dedicated task execution interface, which again is developer-surface oriented.

Taken together, there is a credible product gap for a portal that treats specs as first-class, reviewable artifacts for non-engineering stakeholders while still syncing them into repos for developers.

## Architecture blueprint aligned to your workflow

This section describes a concrete architecture that directly implements your stated flow: project setup, feature spec drafting, clarifying questions, approvals, repo sync onto branches, developer implementation, and completion tracking.

### Core components

**Web portal (Next.js)**  
Primary UX for business analysts, product owners, and reviewers. Responsibilities:

- Project and repo association management
- Feature creation and spec drafting UI with templates
- Structured clarifying questions UI (multi-select, radio, free text)
- Approval workflow (draft, review, approved, handed off, done)
- Status dashboards (by project, feature, repo)

**Backend API and orchestration service**  
Can live as Next.js server routes initially, but clean separation is recommended once you add queueing and background workers. Responsibilities:

- Authorization and RBAC (org, project, repo, feature scopes)
- LLM calls and prompt orchestration
- Template versioning and rendering
- GitHub App integration and repo synchronization
- Event processing (webhooks) and status updates
- Audit logging

**GitHub App integration layer**  
Your GitHub App is the “hands” that writes to repos and listens for changes:

- Create branches and commit spec files by writing Git references and content, which GitHub documents as first-class REST endpoints.
- Create or update pull requests via REST APIs.
- Subscribe to webhook events for push and pull request lifecycle events to update portal state in real time.
- Optionally create check runs, which GitHub notes must be done via a GitHub App.

**LLM gateway with BYOK controls**  
You have two realistic implementation options:

- Build a minimal internal gateway: store provider keys in a secrets store, perform server-side calls, log usage, enforce limits.
- Use an external gateway pattern similar to Vercel AI Gateway BYOK (team-scoped credentials, reuse across projects, optional fallback behavior).

If you want Claude Code users to be able to reuse enterprise auth patterns, note that Claude Code supports multiple auth modes, including `ANTHROPIC_API_KEY` via environment variable and subscription OAuth credentials via `/login`, and keys can take precedence when set. This motivates a design where business-side spec generation uses API keys, but developer-side implementation remains flexible and tool-controlled.

### Artifact format strategy

Your portal should not hard-bind to one tool’s file format. Instead, treat “spec format” as a configurable export profile.

A pragmatic baseline is to adopt the cross-tool common denominator:

- `requirements.md` (business outcomes, user stories, acceptance criteria)
- `design.md` (technical approach, diagrams as needed, constraints)
- `tasks.md` (trackable implementation steps)

This mirrors Kiro's documented spec core structure and workflow, and is broadly compatible with how developers think about SDD artifacts.

From there, add optional export profiles:

- **Spec Kit profile:** generate files and command guidance that match the `/specify` → `/plan` → `/tasks` cadence.
- **OpenSpec profile:** generate an OpenSpec folder structure and "propose / continue" guidance that developers can use in supported assistants, leveraging OpenSpec's broad tool integration and "No API Keys" stance.
- **BMAD profile:** generate role-oriented artifacts (brief, PRD, architecture, dev plan) that map to its multi-agent workflow positioning.

Template customization is a core requirement you called out, and Spec Kit provides a strong reference implementation: it supports extensions and presets, explains how template resolution is performed, and documents project-local overrides for one-off adjustments. Your portal can replicate this as "Template Packs" with priority ordering and per-project overrides.

## Git and multi-repo workflow design

Your proposed multi-repo plan is workable, but it needs clear rules for source of truth, branch naming, and lifecycle state transitions.

### Data model that matches the workflow

At minimum:

- **Organization**: RBAC boundary, holds BYOK configuration, template packs, audit logs.
- **Project**: logical product area, contains one or more repos.
- **Repo attachment**: GitHub repo association plus default branch rules and branch naming template.
- **Feature**: your “unit of work” spanning one or more repos.
- **Spec revision**: immutable record of a spec snapshot plus review decisions.
- **Repo sync record**: which commit SHA and branch name contains which revision’s spec in each repo.

### Branch naming and cross-repo consistency

A robust convention is to make branch naming deterministic from `(projectKey, featureId, revision)`.

Example pattern (configurable):

`specforge/{projectKey}/{featureId}-{slug}/r{revision}`

Determinism matters because it lets you:

- Create the same branch name across multiple repos for one feature.
- Reconcile portal state from repo state even if webhooks are delayed.
- Avoid race conditions when multiple users attempt sync.

GitHub's REST API treats branches as git references and provides endpoints to read and write references, which is the underlying mechanism you need for branch creation by automation.

### Sync mechanics

A common and low-friction sync model:

- On “Approved,” the portal instructs the GitHub App to:
  - Create branch from default branch (by creating a new ref pointing to a base commit).
  - Commit spec files into a dedicated directory (example: `specforge/<featureId>/...`).
  - Optionally open a PR titled “Spec: <feature name>” for final approval or traceability.

Creating and managing pull requests through the REST API is explicitly supported.

- On “Handed off,” developers either:
  - Pull that branch locally and implement directly, or
  - Open an implementation PR from that branch to main.

- On merge, your webhook listener marks the feature complete.

GitHub webhooks are designed for exactly this: real-time notifications for events like commits being pushed and PRs opened or merged.

### Optional: MCP and developer-side context enrichment

You said MCP servers are optional. If you later want to add “context on tap” without forcing developers into a new tool, MCP is a credible integration point.

GitHub documents MCP as a protocol that lets Copilot Chat integrate with other systems and notes growing support for remote MCP servers across major editors. In practice, you could ship a "Spec Forge MCP server" that exposes read-only endpoints such as:

- Fetch approved spec revision
- Fetch clarifying Q&A history
- Fetch cross-repo dependency notes
- Fetch test plan or acceptance criteria

This keeps the portal as the collaboration surface while making its output accessible inside dev tools during implementation.

## MVP build plan and how to get started

A realistic path is to build backward from the moment of value: “an approved spec becomes a branch in one or more repos, and everyone can see its status.”

### MVP scope that proves feasibility quickly

**Portal features**

- Auth and org/project setup
- Repo association (via GitHub App installation and repo selection)
- Feature creation
- Markdown-based spec editor with a fixed baseline template (requirements/design/tasks)
- Approval workflow: Draft → In review → Approved → Handed off → Done
- Activity log per feature

**Repo sync features**

- Create deterministic feature branches across selected repos
- Commit spec files to branch
- Listen to PR merged events and mark done

This part is very feasible with standard GitHub App patterns, webhooks, and REST APIs. citeturn4search1turn4search5turn4search9turn4search2

**AI assist features (BYOK-minimal)**

- Org-level “LLM provider config” page with one provider first (Anthropic or OpenAI)
- Generate an initial spec draft from a structured form (problem, goals, non-goals, acceptance criteria)
- Generate a short clarifying questions set, then apply answers to revise the spec

The “verify at each phase” mindset is explicitly baked into the Spec Kit flow, which you can adopt as a UX principle: enforce a pause where users review, refine, and confirm before moving forward. citeturn2view2turn8view2

### BYOK implementation sequence that reduces risk

Given OpenAI’s guidance against client-side keys and the policy sensitivity around key sharing, start with an enterprise-safe posture. citeturn4search0turn4search12

A staged approach:

- **Stage A (internal alpha):** single-tenant deployment for your org, keys stored server-side in a secrets manager, strict RBAC, audit logs.
- **Stage B (team-scoped BYOK):** keys scoped to org workspace with admin-managed access, similar to how OpenCode Zen models admin/member roles and key management. citeturn2view4
- **Stage C (user-scoped keys):** allow per-user keys only if your compliance posture supports it, and only with strong controls and explicit user acknowledgement.

If you want to support a “BYOK proxy” pattern for some developer tools, LiteLLM documents a concrete mechanism for Claude Code BYOK where the user key is forwarded via headers to the provider while the proxy still applies routing and guardrails. citeturn1search7 This is a useful reference if you later want to integrate usage tracking and policy enforcement without owning model routing logic end to end.

### Developer ecosystem support without forcing a CLI on business users

You can support Copilot and Claude Code primarily by output compatibility, not by embedding those tools in your portal:

- Spec Kit explicitly works with multiple agents including GitHub Copilot, Claude Code, and OpenCode, and documents a broad supported-agent list. citeturn2view2turn9view0
- OpenSpec claims native integration with GitHub Copilot, Claude Code, OpenCode, and others, while also emphasizing “No API Keys” as part of its philosophy. citeturn2view0

This means the portal’s job is to create high-quality, structured artifacts, and developers keep their preferred execution surface.

Separately, if your enterprise already uses Copilot and wants BYOK, GitHub’s Copilot BYOK capability for custom models is directly relevant: you can configure your preferred provider keys within GitHub Enterprise and expose those models to Copilot Chat users. citeturn5view0 This can reduce pressure on Spec Forge to be the only BYOK surface in the organization.

## Risks and guardrails that determine success

### BYOK security and compliance risk

If Spec Forge stores customer API keys, you must implement strict controls and align with provider guidance:

- Never expose keys client-side, keep them on the server, and use secret management services. citeturn4search0turn4search8
- Treat least-privilege scope assignment as a requirement. GitHub’s Copilot BYOK documentation explicitly recommends least privilege scopes for API keys. citeturn5view0
- Prefer single-tenant or self-hosted deployments for early phases if “personal keys” is a hard requirement, because it keeps keys within the organization boundary.

### Workflow and adoption risk

SDD adds ceremony. The point is to reduce rework and drift, but without good UX it can become “more docs, same confusion.” The InfoQ enterprise adoption guidance highlights that the biggest impact can be cultural rather than purely technical, and that SDD adoption needs integration with existing workflows rather than being treated as a standalone technical rollout. citeturn8view3

Practical mitigations:

- Keep approval gates lightweight: short clarifying question loops, minimal required fields.
- Make “diffs” and history first-class so reviewers can see what changed between revisions.
- Limit artifact sprawl: default templates should be small, with optional depth.

### Spec drift and branch hygiene risk

If business stakeholders continue editing specs after developers start implementing, you will create merge conflicts and ambiguity.

Mitigation pattern:

- Freeze spec edits at “Handoff,” allowing changes only via a new revision that creates a new branch or a new commit that triggers an explicit re-approval.
- Use GitHub checks to enforce that a “feature spec directory” exists and matches required schema before a PR can merge, which is feasible via check runs created by a GitHub App. citeturn4search38

### Optional integration risk: MCP and agent toolchains

MCP can add value, but it increases your surface area for security and support. GitHub notes enterprises can enable or disable MCP usage via policy, which means MCP-based features may not be universally available in your environment. citeturn5view1 Treat MCP as an enhancement layer, not a foundational dependency.

### Competitive and reference-point risk

Traycer’s roadmap shows BYOK as a requested feature and currently “in review,” which reinforces that BYOK is a differentiator and a real pain point. citeturn8view1 Your advantage is not rebuilding Traycer, Kiro, or Spec Kit, but combining:

- Business-side accessibility (portal-first)
- Repo-native artifact sync (Git as the integration layer)
- BYOK as a first-class security and cost requirement
- Multi-repo project planning under a single feature umbrella
