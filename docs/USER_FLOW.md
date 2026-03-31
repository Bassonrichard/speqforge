# User Onboarding Flow - SeqForge Portal

## Complete End-to-End User Journey

This document outlines the complete onboarding process for a new user in SeqForge Portal.

---

## 1. Initial Authentication → Organization Setup

### Step 1: Sign In with GitHub
- **URL**: `/login`
- **Action**: Click "Sign in with GitHub"
- **Backend**: OAuth flow redirects to GitHub, then back to `/auth/callback`
- **Result**: User authenticated and session created

### Step 2: Create Organization (New Users)
- **URL**: `/dashboard`
- **Condition**: If user has no organizations
- **UI**: Shows empty state with "CREATE ORGANIZATION" button
- **Action**: Click button → Shows `CreateOrganizationForm`
- **Form Fields**:
  - Organization Name (required, 3-100 chars)
  - Approval Threshold:
    - **SINGLE**: Any one approver can approve
    - **MAJORITY**: More than 50% must approve
    - **UNANIMOUS**: All assigned approvers must approve
- **API**: `POST /api/auth/organizations`
- **Backend**: Creates `Organization` and adds user as `ADMIN` via `OrgMember`
- **Result**: User automatically assigned to new org, redirected to `/dashboard/projects?org={orgId}`

---

## 2. Organization & Team Management

### View Organization Settings
- **URL**: `/dashboard/settings`
- **Access**: Navigate via sidebar "Settings" link
- **Display**:
  - Organization name
  - Approval threshold setting
  - List of all team members with roles
  - Quick links to AI Configuration and Spec Templates

### Manage Team Members
- **Current Status**: Read-only view of members
- **API Ready**: `POST /api/auth/organizations/[orgId]/members/add`
- **Future**: Add UI to invite/assign roles
- **Roles Available**:
  -  `ADMIN`: Full access
  - `MEMBER`: Standard access
  - `APPROVER`: Can approve specs
  - `REVIEWER`: Can review and comment

---

## 3. Project Creation & Repository Linking

### Create Project
- **URL**: `/dashboard/projects` → "New Project" button
- **Form Fields**:
  - Project name (required)
  - Project key (e.g., "PRJ", used in branch names)
  - Description (optional)
- **API**: `POST /api/projects`
- **Backend**: Creates `Project` linked to current org
- **Result**: Project created and accessible in projects list

### Link Repositories
- **URL**: `/dashboard/projects/[id]` → "Link Repository" section
- **Prerequisites**: 
  - GitHub App must be installed on target repositories
  - User must have access to the repos
- **Action**: Select repo from dropdown or input full name (`owner/repo`)
- **API**: `POST /api/projects/[id]/repos`
- **Backend**: Creates `RepoAttachment` linking project to GitHub repo
- **Result**: Repo appears in project's linked repositories list

---

## 4. AI Configuration (BYOK)

### Configure LLM Providers
- **URL**: `/dashboard/settings/llm`
- **Access**: Admin-only (owner or admin role required)
- **Options**:
  
  **Option A: API Keys (OpenAI, Anthropic)**:
  - Enter API key
  - Select provider (OpenAI, Anthropic, Google AI)
  - Mark as default (optional)
  - API: `POST /api/llm/keys`
  - Encryption: AES-256-GCM via `crypto.ts`
  - Storage: `UserKey` table with `encryptedKey` field
  
  **Option B: OAuth (GitHub Copilot)**:
  - Click "Connect GitHub" button
  - OAuth flow: authorize → callback
  - API: `/api/llm/oauth/[provider]/authorize` → `/callback`
  - Storage: Access token + refresh token encrypted in `UserKey`
  
- **Result**: Organization can now use configured LLM for spec generation

### Configure Spec Templates (Optional)
- **URL**: `/dashboard/settings/templates`  
- **Access**: Admin-only
- **Actions**:
  - Upload custom `.md` template files
  - View existing templates
  - Set default template
  - Delete templates (if not active)
- **API**: `POST /api/templates`, `DELETE /api/templates/[id]`
- **Validation**: Must include required sections (User Scenarios, Functional Requirements, Success Criteria, Assumptions)
- **Result**: Custom templates available during feature creation

---

## 5. Feature Creation & Spec Generation

### Create Feature
- **URL**: `/dashboard/features/new`
- **Prerequisites**: 
  - Project exists
  - At least one repo linked to project
  - LLM configured (BYOK)
- **Form Fields**:
  - Feature title (required)
  - Description (required, natural language)
  - Project selection (dropdown)
  - Template selection (optional, defaults to org default)
- **API**: `POST /api/features`
- **Backend Flow**:
  1. Creates `Feature` record (status: DRAFT)
  2. Triggers spec generation via `spec-service.ts`:
     - Loads selected template or default
     - Pre-fills metadata placeholders (FEATURE_ID, FEATURE_TITLE, etc.)
     - Calls LLM via `llm-gateway.ts` using org's configured credentials
     - Creates `SpecRevision` with generated content
     - Creates branch in linked repos: `spec/{projectKey}/{featureId}-{slug}`
  3. Returns feature ID
- **Result**: Feature with AI-generated specification ready for review

### View & Edit Specification
- **URL**: `/dashboard/features/[id]`
- **Display**:
  - Feature metadata (title, status, project, linked repos)
  - Spec editor (markdown content)
  - Status timeline (audit trail)
  - Approval workflow UI (if pending review)

---

## 6. Approval Workflow

### Request Review
- **Condition**: Feature status is DRAFT
- **UI**: `ReviewerSelector` component appears
- **Action**: 
  - Check boxes to select reviewers (APPROVER/REVIEWER roles only)
  - Click "Request Review"
- **API**: `POST /api/features/[id]/approve` with `action: request-review`
- **Backend**: Creates `SpecApproval` record with assigned reviewers
- **Result**: Status changes to IN_REVIEW, reviewers notified

### Approve Specification
- **Condition**: User is assigned reviewer, spec is IN_REVIEW
- **UI**: `ApprovalStatus` component shows:
  - Progress bar (e.g., "2/3 approvals required")
  - List of reviewers with approval status
  - Approve/Reject buttons (for assigned reviewers only)
  - Comment field (optional)
- **Action**: Click "Approve" → optionally add comment
- **API**: `POST /api/features/[id]/approve` with `action: approve`
- **Backend**: 
  - Adds user to `approvedBy` list
  - Checks approval threshold (SINGLE/MAJORITY/UNANIMOUS)
  - If threshold met → status changes to APPROVED
- **Result**: Spec approved (auto-transitions when threshold met)

### Reject Specification
- **Action**: Click "Reject" → enter rejection reason (required)
- **API**: `POST /api/features/[id]/approve` with `action: reject`
- **Backend**: Sets status to REJECTED, stores rejection reason
- **Result**: Spec returns to author for revisions

---

## 7. Hand-Off to Engineering

### Trigger Hand-Off
- **Condition**: Feature status is APPROVED
- **URL**: `/dashboard/features/[id]` → Click "Hand Off to Engineering"
- **API**: `POST /api/features/[id]/handoff`
- **Backend Flow**:
  - Commits spec files to branch in all linked repos
  - Opens pull request with spec content
  - Creates `RepoSyncRecord` entries
  - Updates feature status to HANDED_OFF
  - Registers webhook to track PR merge
- **Result**: PRs created in GitHub repos, engineering team can review and merge

---

## API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/organizations` | GET | List user's organizations |
| `/api/auth/organizations` | POST | Create new organization |
| `/api/auth/organizations/[orgId]` | GET | Get org details & threshold |
| `/api/auth/organizations/[orgId]/members` | GET | List org members |
| `/api/auth/organizations/[orgId]/members/add` | POST | Add member to org |
| `/api/projects` | POST | Create project |
| `/api/projects/[id]/repos` | POST | Link repository to project |
| `/api/llm/keys` | GET/POST/DELETE | Manage API keys (BYOK) |
| `/api/llm/oauth/[provider]/authorize` | GET | Start OAuth flow |
| `/api/llm/oauth/[provider]/callback` | GET | Complete OAuth flow |
| `/api/templates` | GET/POST | Manage spec templates |
| `/api/features` | POST | Create feature |
| `/api/features/[id]/approve` | POST | Request review / approve / reject |
| `/api/features/[id]/handoff` | POST | Hand off spec to engineering |
| `/api/specs/generate` | POST | Generate spec via LLM |

---

## Key Settings by Role

### Organization Admin (ADMIN/OWNER)
- ✅ Create organization
- ✅ Invite team members
- ✅ Configure BYOK (API keys, OAuth)
- ✅ Manage spec templates
- ✅ Create projects
- ✅ Link repositories
- ✅ Create features
- ✅ Approve specs (if also APPROVER role)

### Approver (APPROVER)
- ✅ View projects and features
- ✅ Approve/reject specs
- ✅ Add review comments
- ❌ Configure org settings
- ❌ Manage BYOK

### Reviewer (REVIEWER)
- ✅ View projects and features
- ✅ Comment on specs
- ✅ Approve/reject specs (if allowed by threshold)
- ❌ Configure org settings

### Member (MEMBER)
- ✅ View projects and features
- ✅ Create features (if permitted)
- ❌ Approve specs
- ❌ Configure org settings

---

## Settings Pages

| Page | URL | Access | Purpose |
|------|-----|--------|---------|
| Organization Settings | `/dashboard/settings` | All members | View org info, team members, quick links |
| AI Configuration | `/dashboard/settings/llm` | Admin only | Configure BYOK (API keys, OAuth) |
| Spec Templates | `/dashboard/settings/templates` | Admin only | Upload/manage custom templates |

---

## Next Steps for Complete Integration

1. **Member Invitation UI**: Add form to `/dashboard/settings` for inviting users by GitHub username
2. **Role Management UI**: Add role assignment/update interface
3. **Approval Threshold Config UI**: Add settings page to change org approval threshold
4. **Notifications**: Add UI toasts for approval assignments and status changes
5. **E2E Testing**: Write Playwright tests covering full user journey

---

## Technical Notes

- **Session Storage**: JWT in HTTP-only cookies
- **Authentication**: GitHub OAuth
- **Encryption**: AES-256-GCM for API keys and OAuth tokens
- **Database**: SQLite with Prisma ORM
- **LLM Gateway**: Supports OpenAI, Anthropic, GitHub Copilot (OAuth)
- **GitHub Integration**: GitHub App with installation tokens

---

## Build Status

✅ **Build passing**: 40 routes registered
✅ **Organization creation**: Functional
✅ **BYOK configuration**: Functional (admin-only)
✅ **Project & repo linking**: Functional
✅ **Spec generation**: Functional with org credentials
✅ **Approval workflow**: Functional with threshold logic
✅ **Settings navigation**: Integrated in dashboard sidebar
