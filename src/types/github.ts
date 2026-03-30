/**
 * GitHub API response types
 * Commonly used types when interacting with GitHub REST API via Octokit
 */

export interface GHRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  default_branch: string;
  private: boolean;
  description: string | null;
  html_url: string;
}

export interface GHBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GHRef {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: 'commit' | 'tree' | 'tag';
    url: string;
  };
}

export interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GHPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft: boolean;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  merged_by: {
    login: string;
  } | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  html_url: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

export interface GHWebhookPayload {
  action?: string;
  pull_request?: GHPullRequest;
  repository: GHRepository;
  sender: {
    login: string;
    avatar_url: string;
  };
}

export interface GHInstallation {
  id: number;
  app_id: number;
  target_id: number;
  target_type: 'User' | 'Organization';
  permissions: Record<string, 'read' | 'write'>;
  events: string[];
  created_at: string;
  updated_at: string;
  access_tokens_url: string;
  repositories_url: string;
}

export interface GHUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GHContentFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string; // Base64 encoded
  encoding?: 'base64';
  url: string;
  html_url: string;
  download_url: string | null;
}

export interface GHCheck {
  id: number;
  node_id: string;
  head_sha: string;
  external_id: string;
  url: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion:
    | 'action_required'
    | 'cancelled'
    | 'failure'
    | 'neutral'
    | 'success'
    | 'skipped'
    | 'stale'
    | null;
  started_at: string | null;
  completed_at: string | null;
  name: string;
  check_suite: {
    id: number;
  };
}

/**
 * GitHub App webhook event types
 */
export type GHWebhookEvent = 'pull_request' | 'push' | 'check_run' | 'workflow_run' | 'pull_request_review';

/**
 * Pull request webhook actions
 */
export type GHPRWebhookAction = 'opened' | 'closed' | 'synchronize' | 'edited' | 'ready_for_review' | 'converted_to_draft';

/**
 * Type guard for pull request webhook
 */
export function isGHPullRequestWebhook(
  payload: GHWebhookPayload
): payload is GHWebhookPayload & { pull_request: GHPullRequest } {
  return !!payload.pull_request;
}

/**
 * Parse merge status from PR webhook
 */
export function getPullRequestMergeStatus(pr: GHPullRequest): 'open' | 'merged' | 'closed' {
  if (pr.state === 'closed' && pr.merged_at) return 'merged';
  if (pr.state === 'closed') return 'closed';
  return 'open';
}
