# Feature Specification: Spec Forge Portal

**Feature Branch**: `001-spec-forge-portal`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: "Spec Forge Portal: Web-based spec-driven development platform for business users"

## Clarifications

### Session 2026-03-30

- Q: When a user creates a new spec revision (e.g., `r2`), what should happen to the previous revision (`r1`)? → A: Only the latest revision is "active"; older revisions are archived/read-only. Only the latest approved spec gets committed to repos. Previous revisions remain available as historical reference but do not trigger new branches or PRs.

- Q: In the approval workflow, when multiple reviewers are assigned, what should be required for the spec to move to Approved status? → A: Configurable per org (unanimous, single, majority). Default: Single approver model—only ONE designated approver role (e.g., "Tech Lead") needs to approve. Org admins can change this policy.

- Q: When syncing specs to multiple repos, if one repo fails (permissions, network, branch exists), what should happen? → A: Best-effort partial sync. Continue attempting all repos. Record successes/failures. Show user summary (e.g., "2 of 3 repos synced"). Developers can start work on successful repos; failed repos marked for manual intervention.

- Q: When should feature status transitions (Draft → Approved → Handed Off → In Progress → In Merge → Complete)? → A: Approvals are manual (user clicks "Approve"). Handoff is manual (user clicks "Hand Off"). GitHub webhooks auto-detect: PR opened → In Progress, PR merged → In Merge. PR merge triggers auto-transition to Complete. Business users retain control; developers have no extra workflow burden.

- Q: Who can upload/modify custom templates, and what scope (org/project/feature)? → A: Org admins only, org-wide scope. Only organization administrators can upload custom templates. Templates are org-wide; all projects in the org share the same available templates. Feature creators select a template when creating a feature.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Business User Creates Project and Feature (Priority: P1)

A product owner or business analyst opens the Spec Forge portal, creates a new project, links one or more GitHub repositories, and initiates a new feature by writing a high-level feature description. This is the core entry point that enables non-technical stakeholders to engage with spec-driven development.

**Why this priority**: This is the foundation of the entire system. Without the ability to create projects and features, the portal has no value. This story represents the "create" phase in the spec-driven workflow and directly addresses the key problem statement: enabling business users to engage without IDE/terminal access.

**Independent Test**: Can be fully tested by creating a project, linking repos, and starting a feature creation flow. This alone delivers the core value of providing a web-based interface for business stakeholders.

**Acceptance Scenarios**:

1. **Given** a user is logged into the portal, **When** they click "New Project", **Then** they see a form to enter project name, select repositories from their GitHub account, and set optional branch naming patterns, and **can** save the project.
2. **Given** a project exists, **When** the user clicks "New Feature", **Then** they see a form to enter feature title and initial description (free text), and **can** proceed to the spec drafting phase.
3. **Given** a feature is created, **When** the user enters a description, **Then** the system displays the text in a clean UI and provides an **Edit**/**Next** action.

---

### User Story 2 - AI-Assisted Spec Drafting with Templates (Priority: P1)

The user enters a feature description and the system uses templates and AI to generate an initial specification (requirements, design, tasks). The specification follows the configured template and uses the LLM provider's capabilities to flesh out details like user scenarios, functional requirements, and success criteria.

**Why this priority**: This is the core differentiation and value proposition. Without AI-assisted generation, users are back to manually writing specs. This directly solves the problem of making spec creation accessible and fast for non-technical stakeholders.

**Independent Test**: Can be fully tested by entering a feature description, triggering spec generation, and verifying that a structured spec with requirements, design, and tasks is produced. This alone demonstrates the portal's AI-powered automation value.

**Acceptance Scenarios**:

1. **Given** a feature description is entered, **When** the user clicks "Generate Spec", **Then** the system calls the configured LLM provider to draft a spec using the organization's template, and **displays** a markdown preview of the generated spec.
2. **Given** a spec is generated, **When** the user views it, **Then** the spec contains populated sections: User Scenarios, Functional Requirements, Success Criteria, and Assumptions, **all** rendered in a clean markdown editor with syntax highlighting.
3. **Given** a spec is shown, **When** the user is satisfied with the initial draft, **Then** they **can** click **Next** to proceed to the clarifying questions phase.

---

### User Story 3 - Interactive Clarifying Questions with Guided Refinement (Priority: P1)

After the initial spec is generated, the system presents up to 3 clarifying questions (using radio buttons, checkboxes, or text fields) to resolve ambiguities or confirm critical decisions. The user answers these questions, and the system regenerates the spec with those clarifications incorporated.

**Why this priority**: This is essential for producing high-quality, unambiguous specs. It directly addresses the gap in current SDD tools where business users must manually resolve unclear requirements. This directly enables the workflow described in the vision.

**Independent Test**: Can be fully tested by generating a spec, answering clarifying questions, and verifying that the spec is updated with the answers. This alone demonstrates guided spec refinement.

**Acceptance Scenarios**:

1. **Given** a spec is generated, **When** the system identifies up to 3 unclear or critical aspects, **Then** it presents them as a series of questions with options (e.g., "Should authentication be: A) OAuth2, B) Email/Password, C) SSO?") and a free-text field for custom answers.
2. **Given** clarifying questions are displayed, **When** the user selects or enters an answer, **Then** the system updates the background spec data and **displays** a diff showing what changed in the spec.
3. **Given** the user answers all questions, **When** they click "Confirm", **Then** the system regenerates the full spec with the answers incorporated, and **displays** the updated version.
4. **Given** the user is satisfied, **When** they click "Approve Spec", **Then** the spec moves to the **Approved** status and is ready for handoff.

---

### User Story 4 - Multi-Repo Branch and PR Creation (Priority: P1)

Once a spec is approved, the system automatically creates a dedicated feature branch in each linked repository, commits the spec files (requirements.md, design.md, tasks.md) into each branch, and optionally opens a pull request. This handoff enables the developer workflow.

**Why this priority**: This is the critical bridge between business users (in the portal) and developers (in their IDEs). Without this automated handoff, the portal is isolated from the development workflow. This directly enables the "hand off to developers" phase in the vision.

**Independent Test**: Can be fully tested by approving a spec and verifying that branches are created in GitHub repos and contain the spec files. This alone demonstrates the integration between the portal and GitHub.

**Acceptance Scenarios**:

1. **Given** a spec is approved, **When** the system is configured with a GitHub App and target repositories, **Then** it creates a branch in each repository using a deterministic name (e.g., `spec/PRJ/123-feature-name`) based on the project's branch naming pattern.
2. **Given** a branch is created, **When** the system commits files, **Then** it writes spec files (requirements.md, design.md, tasks.md) to the branch under the path `specs/feature-{ID}/`, with a clear commit message linking back to the feature.
3. **Given** files are committed, **When** configured to open PRs, **Then** the system creates a pull request in each repository with a title like "Spec: [Feature Name]" and a description linking to the portal feature.
4. **Given** a pull request is created, **When** the developer views it, **Then** they see the full spec and can immediately start implementation using their preferred agent (GitHub Copilot, Claude Code, etc.).

---

### User Story 5 - Feature Status Tracking and Developer Handoff (Priority: P2)

The portal tracks the status of each feature throughout its lifecycle: Draft → Approved → In Review → In Progress → In Merged → Complete. Developers see the spec in their repo and implement against it. When PRs are merged, the portal updates the feature status to reflect progress.

**Why this priority**: This provides visibility and closure to the business team. It enables teams to track which features are done and coordinate handoffs to testers or product reviews. This supports the vision of "completion tracking and handing off to testers."

**Independent Test**: Can be fully tested by creating and approving a feature, then verifying that status updates occur as PRs are created and merged. This alone shows feature lifecycle management.

**Acceptance Scenarios**:

1. **Given** a spec is approved and handed off, **When** the user views the feature in the portal, **Then** the status shows **Handed Off** and **displays** the branch name and PR URL for each repository.
2. **Given** a PR is open in a repository, **When** the developer merges it, **Then** the portal receives the webhook event and updates the feature status to **In Merge** or **Complete** (configurable).
3. **Given** a feature is complete, **When** the business user views it, **Then** they **can** click a button to mark it as "Ready for Testing" or "Ready for Review" to hand off to QA or launch teams.

---

### User Story 6 - Organization-Level BYOK Configuration (Priority: P1)

An organization administrator accesses a settings panel, enters API keys for supported LLM providers (OpenAI, Anthropic, Google AI, etc.), and the system securely stores these keys (encrypted). When any team member uses the portal, LLM calls use the organization's configured keys without exposing keys to the browser.

**Why this priority**: BYOK is explicitly stated as a hard requirement in the vision. This is the security and cost control mechanism that makes the portal viable for enterprise adoption. Without this, users must manage their own keys, which creates security risks and blurs cost responsibility.

**Independent Test**: Can be fully tested by configuring keys, using the portal to generate a spec, and verifying that the LLM call succeeds without exposing keys to the frontend. This alone demonstrates BYOK security compliance.

**Acceptance Scenarios**:

1. **Given** an admin user is logged in, **When** they access **Settings** → **LLM Providers**, **Then** they see a form to enter API keys for OpenAI, Anthropic, Google AI, and other supported providers.
2. **Given** a key is entered, **When** the admin clicks **Save**, **Then** the system encrypts the key using KMS or a similar mechanism, stores it in the database, and **does not** display the key again (only shows a masked version like `sk-...xyz`).
3. **Given** keys are configured, **When** any team member uses the portal to generate a spec, **Then** the backend decrypts the key in-memory, calls the LLM using that key, and **never** exposes the key to the browser or logs it in plain text.
4. **Given** multiple providers are configured, **When** the admin selects a default provider, **Then** all LLM calls use that provider unless overridden per-request.

---

### User Story 7 - Customizable Spec Templates and Organizational Configuration (Priority: P2)

An organization can define or import custom spec templates (breaking down what/how/tasks). The portal comes with sensible defaults inspired by Spec Kit and Kiro, but administrators **can** upload or modify templates to match their organization's processes.

**Why this priority**: This enables the portal to adapt to different organizational maturity levels and methodologies. Organizations using Agile may want different templates than those using formal documentation practices. This extensibility is explicitly mentioned in the vision.

**Independent Test**: Can be fully tested by uploading a custom template, generating a spec using it, and verifying that the spec follows the custom structure. This alone shows template flexibility.

**Acceptance Scenarios**:

1. **Given** an admin is in **Settings** → **Templates**, **When** they upload a Markdown template file, **Then** the system validates it (contains required placeholder sections), stores it, and marks it as **Active** for new features.
2. **Given** a custom template is active, **When** a user generates a spec, **Then** the generated spec follows the custom template structure instead of the default.
3. **Given** multiple templates exist, **When** creating a new feature, **Then** the user **can** select which template to use (or use the default).

---

### User Story 8 - Review and Approval Workflow with RBAC (Priority: P2)

Specs go through an approval workflow: Draft (author) → In Review (assigned reviewers) → Approved (authorized approver). The system enforces role-based access control (RBAC): only designated reviewers **can** approve specs, and only authorized users **can** create projects or modify organizational settings.

**Why this priority**: This supports enterprise governance and compliance. It ensures that specs go through a quality gate before being handed off to developers. This is essential for organizations with formal sign-off processes.

**Independent Test**: Can be fully tested by assigning a spec to a reviewer, having the reviewer reject it, then resubmit and approve. This alone shows approval workflow governance.

**Acceptance Scenarios**:

1. **Given** a spec is in **Draft** status, **When** the author clicks **Request Review**, **Then** the system opens a dialog to select reviewers from the organization, and **marks** the spec as **In Review**.
2. **Given** a spec is in **In Review**, **When** a reviewer views it, **Then** they **can** use an **Approve** or **Request Changes** button, and **can** add comments explaining their feedback.
3. **Given** all assigned reviewers approve, **When** the system detects this, **Then** it **automatically** updates the status to **Approved** and **displays** a **Ready to Handoff** button.
4. **Given** organizational settings define RBAC groups (e.g., "Tech Leads", "Product Managers"), **When** a user attempts to access settings or approve specs, **Then** the system checks their membership in the required group and **grants** or **denies** access accordingly.

---

### User Story 9 - Intelligent Freeze-on-Handoff to Prevent Drift (Priority: P2)

Once a spec is handed off (committed to branches and PRs opened), the portal locks that spec revision. Business users **cannot** edit an approved and handed-off spec; any new changes require creating a new feature or a new spec revision (with a new branch, bumped revision number, e.g., `r2`).

**Why this priority**: This prevents merge conflicts and spec drift between business intent and implementation. It enforces a clear contract: once a spec is handed off, developers implement against that spec; changes require a new iteration.

**Independent Test**: Can be fully tested by approving a spec, handing it off, and verifying that attempts to edit it fail. This alone demonstrates freeze-on-handoff governance.

**Acceptance Scenarios**:

1. **Given** a spec is approved and handed off, **When** the author tries to edit it, **Then** the system **disables** the edit button and **displays** a message: "This spec is locked. To make changes, create a new spec revision."
2. **Given** the developer starts implementing, **When** business users realize they need to adjust the spec, **Then** they **can** click **Create New Revision** to start `r2` with a new branch (e.g., `spec/PRJ/123-feature-x-r2`), and the original spec remains immutable.
3. **Given** a new revision is created, **When** it's approved and handed off, **Then** the portal creates a new PR with the updated spec, and developers **can** decide whether to update their work.

---

### Edge Cases

- What happens when a GitHub repository is deleted or unlinked after specs have been committed?
- How does the system handle LLM API failures during spec generation?
- What happens if an organization runs out of API quota or credits mid-generation?
- How does the system handle merge conflicts if the same branch is committed to in multiple repos with different content?
- What happens if a reviewer's account is deleted or deactivated while a spec is in review?
- How does the portal handle very large organizations with hundreds of repositories?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Project and Repository Management

- **FR-001**: System MUST allow users to create projects (with name, description, and optional key/identifier).
- **FR-002**: System MUST allow organizations to attach one or more GitHub repositories to a project.
- **FR-003**: System MUST support configurable branch naming patterns (e.g., `spec/{projectKey}/{featureId}-{slug}`) that are applied consistently across all repos in a project.
- **FR-004**: System MUST persist project metadata (name, repos, branch pattern) in SQLite database.

#### Feature Creation and Spec Drafting

- **FR-005**: System MUST allow users to create new features within a project by providing a title and initial description.
- **FR-006**: System MUST call a configured LLM provider to generate an initial spec from the feature description and applicable template, producing sections including User Scenarios, Functional Requirements, Success Criteria, and Assumptions.
- **FR-007**: System MUST render the generated spec in a markdown editor with syntax highlighting, allowing inline viewing and minor edits.
- **FR-008**: System MUST persist all spec revisions (with version numbers) to the database, tracking author, timestamp, and approved-by status.

#### Clarifying Questions and Refinement

- **FR-009**: System MUST analyze a generated spec and identify up to 3 key ambiguities that require clarification.
- **FR-010**: System MUST present clarifying questions to the user via UI elements (radio buttons, checkboxes, text inputs) and allow selection or free-text entry.
- **FR-011**: System MUST regenerate the spec with answers incorporated, updating the spec content and presenting a diff of changes.
- **FR-012**: System MUST allow users to iterate: re-answer questions, accept changes, or reject and manually edit.

#### Approval and Sign-Off

- **FR-013**: System MUST support an approval workflow: Draft → In Review → Approved → Handed Off.
- **FR-014**: System MUST allow authors to request reviews and designate specific reviewers.
- **FR-015**: System MUST allow designated reviewers to approve, request changes, or add comments.
- **FR-016**: System MUST enforce role-based access control: only authorized roles (e.g., "Tech Leads") **can** approve specs.
- **FR-016a**: System MUST support configurable approval thresholds per organization: Single Approver (default, one authorized approver sufficient), Unanimous (all reviewers must approve), or Majority (>50% of reviewers must approve). Org admins **can** change the threshold in settings.

#### GitHub Integration and Branch Sync

- **FR-017**: System MUST use a registered GitHub App to authenticate and interact with repositories without requiring users to provide personal access tokens.
- **FR-018**: System MUST create a feature branch in each linked repository using the configured branch naming pattern when a spec is approved and handed off.
- **FR-019**: System MUST commit spec files (requirements.md, design.md, tasks.md) to the feature branch under the path `specs/feature-{ID}/` with a descriptive commit message.
- **FR-020**: System MUST optionally create a pull request in each repository against the default branch, with a title and description linking back to the portal feature.
- **FR-021**: System MUST record the branch name, commit SHA, and PR URL for each repository in the RepoSyncRecord table.
- **FR-021a**: When syncing to multiple repos, System MUST use best-effort partial sync: continue attempting all repos even if one fails. Record success/failure status for each repo. Display a summary to the user (e.g., "Successfully synced to 2 of 3 repos; see details for failure reason"). Developers **can** start work in successfully synced repos while team manually resolves failures.

#### Feature Status Tracking

- **FR-022**: System MUST track feature status throughout its lifecycle: Draft, Approved, Handed Off, In Progress, In Merge, Complete.
- **FR-023**: System MUST listen to GitHub webhooks (PR open, PR merge) and automatically update feature status: PR opened → In Progress, PR merged → In Merge, all linked PRs merged → Complete.
- **FR-023a**: System MUST allow users to manually transition statuses: Draft → Approved (via "Approve Spec" button) and Approved → Handed Off (via "Hand Off" button). Webhook-driven transitions (In Progress, In Merge, Complete) **cannot** be manually overridden.
- **FR-024**: System MUST display the current status, linked branches, PR URLs, and implementation progress in the feature detail view.

#### LLM Provider and BYOK Management

- **FR-025**: System MUST support multiple LLM providers: OpenAI (GPT-4, Codex), Anthropic (Claude), Google AI, and others.
- **FR-026**: System MUST allow organization administrators to add API keys for supported providers in a secure admin panel.
- **FR-027**: System MUST encrypt all API keys using KMS or a similar mechanism before storing them in the database.
- **FR-028**: System MUST never expose API keys to the browser or client-side code; all LLM calls MUST occur on the server side (Next.js server actions or API routes).
- **FR-029**: System MUST allow administrators to set a default provider, which is used for all LLM calls unless overridden per-request.
- **FR-030**: System MUST handle LLM API failures gracefully (rate limits, timeouts, invalid keys) with user-friendly error messages and retry logic.

#### Template and Configuration Management

- **FR-031**: System MUST provide default spec templates (e.g., "Requirements + Design + Tasks") based on Spec Kit and Kiro patterns.
- **FR-032**: System MUST allow only organization administrators to upload custom Markdown templates via **Settings** → **Templates**.
- **FR-033**: System MUST validate custom templates (contain required placeholder sections) before activation.
- **FR-034**: System MUST apply the selected template when generating specs. Templates are org-wide; all projects in the organization share the same available templates.
- **FR-034a**: When a user creates a new feature, they **can** select which org-wide template to use, or the system applies the default template (set by org admin).

#### Security and Governance

- **FR-035**: System MUST implement GitHub OAuth for user authentication; users log in via their GitHub account.
- **FR-036**: System MUST enforce role-based access control (RBAC) at organization, project, and feature scopes (e.g., "Can only approve specs" role).
- **FR-037**: System MUST log all user actions (spec creation, approval, handoff) in an audit log for compliance review.
- **FR-038**: System MUST freeze spec revisions once handed off: locked specs **cannot** be edited, only new revisions **can** be created.
- **FR-039**: System MUST sanitize all user inputs and AI-generated content before storing in the database or committing to Git (prevent code injection, XSS, etc.).
- **FR-040**: System MUST verify GitHub webhook signatures to ensure authenticity of webhook events.

#### Data Persistence and Migrations

- **FR-041**: System MUST use Prisma ORM with SQLite database to persist all metadata (projects, features, specs, RBAC, keys).
- **FR-042**: System MUST provide Prisma migrations for schema changes (e.g., `prisma migrate dev --name add-new-field`).
- **FR-043**: System MUST handle database transactions for critical operations (e.g., approving a spec and creating a branch atomically).

### Key Entities

- **Organization**: Represents a customer workspace. Stores BYOK provider keys, configured templates, RBAC settings, and member list. Attributes: `id`, `name`, `aiSettings` (JSON), `members`.

- **Project**: A grouping of features and repositories. Attributes: `id`, `name`, `description`, `branchPattern`, `orgId` (FK), `repos` (array of RepoAttachment).

- **RepoAttachment**: Links a GitHub repository to a project. Allows a single spec-driven feature to affect multiple repos. Attributes: `id`, `projectId` (FK), `fullName` (e.g., "owner/repo"), `defaultBranch`.

- **Feature**: A planned feature or work item. Attributes: `id`, `projectId` (FK), `title`, `status` (Draft/Approved/HandedOff/InProgress/Complete), `createdBy`, `createdAt`.

- **SpecRevision**: A version of a feature's spec. Immutable once approved. Only the latest approved revision is "active" and triggers repo sync; earlier revisions are archived/read-only for historical reference. Attributes: `id`, `featureId` (FK), `revNumber`, `branchName`, `commitSha`, `approvedBy`, `approvedAt`, `isActive` (boolean), `content` (stored in Git, referenced by commit).

- **RepoSyncRecord**: Tracks where a spec has been committed across repos. Attributes: `id`, `specRevId` (FK), `repoId` (FK), `branch`, `prUrl`, `status` (Committed/PROpen/Merged).

- **UserKey**: Encrypted API keys for LLM providers. Attributes: `id`, `ownerType` (Org/User), `ownerId`, `provider` (OpenAI/Anthropic/etc.), `encryptedKey`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Business users **can** create and approve a complete feature spec (with clarifying questions resolved) from initial description in under 15 minutes without touching CLI or IDE.

- **SC-002**: Non-technical stakeholders **can** use the portal with minimal onboarding (< 5 minutes of documentation/tutorial); interface is intuitive without requiring LLM or spec-driven development expertise.

- **SC-003**: Developers **can** pull a feature branch and immediately see a complete, coherent spec (requirements, design, tasks) that integrates seamlessly with GitHub Copilot, Claude Code, and other agents (verified by developer feedback: "Spec was clear and actionable").

- **SC-004**: Spec generation from initial description to approved, handed-off spec takes < 5 minutes on average (accounting for clarifying questions).

- **SC-005**: Multi-repo features are supported: a single approved spec **can** be synchronized across 3+ repositories simultaneously with deterministic branch names, with no merge conflicts.

- **SC-006**: BYOK implementation is verified: API keys are never exposed to the browser, and all LLM calls use server-side-only authentication (confirmed via security audit or code review).

- **SC-007**: Feature lifecycle tracking is accurate: feature status reflects reality (spec approved → branch created, PR merged → status updated) with < 2-minute webhook latency.

- **SC-008**: RBAC is enforced: users without "Approver" role **cannot** approve specs; actions are logged and auditable.

- **SC-009**: Freeze-on-handoff prevents unintended edits: locked specs **cannot** be modified; attempting to edit shows a clear error message.

- **SC-010**: Organizations **can** define custom templates; custom templates are applied consistently across all new features in that organization.

---

## Assumptions

- **Assumption 1**: Target users have GitHub accounts and access to GitHub repositories. Authentication via GitHub OAuth is feasible and acceptable.

- **Assumption 2**: Supported LLM providers (OpenAI, Anthropic, Google AI) are configured by organization admins; end users do not manage keys directly.

- **Assumption 3**: Spec files (requirements.md, design.md, tasks.md) are the primary artifacts; SQLite stores only metadata and references to commits. This minimizes database size and leverages Git as the source of truth.

- **Assumption 4**: Developers will use the portal's generated specs in their existing agents (GitHub Copilot, Claude Code). The portal does not need to build its own IDE extension initially; specs in Git are sufficient.

- **Assumption 5**: Clarifying questions are generated by applying a secondary LLM call to the spec; up to 3 questions are identified and presented. This assumes LLM providers support this capability.

- **Assumption 6**: Organizations have admin users who **can** configure LLM keys. For MVP, we assume a single admin can manage all org keys. Fine-grained user-level BYOK is deferred.

- **Assumption 7**: GitHub webhooks are reliable and trigger within 1-2 minutes. The portal relies on webhooks to update feature status; eventual consistency (not real-time) is acceptable.

- **Assumption 8**: Network connectivity and uptime requirements align with typical SaaS expectations (99.5% uptime). The portal is multi-tenant; downtime affects all organizations.

- **Assumption 9**: Compliance requirements (SOC 2, GDPR, HIPAA) are out of scope for MVP; basic security practices (encryption in transit, HTTPS, audit logging) are sufficient.

- **Assumption 10**: The portal integrates with existing GitHub Copilot and Claude Code workflows without requiring changes to those tools. Developers simply pull the branch and use their agent as usual.

- **Assumption 11**: Repositories are public or the authenticated user has write access. Private repos require appropriate GitHub App permissions (already in the GitHub App manifest).

- **Assumption 12**: Spec content is Markdown; the portal does not need to support rich-text editors or custom formats for MVP.
