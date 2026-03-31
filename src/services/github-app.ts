import { Octokit } from 'octokit';
import { GHRepository, GHPullRequest, GHContentFile } from '@/types/github';
import { SyncError, AuthenticationError } from '@/types/errors';

/**
 * GitHub App Service - handles all GitHub API operations
 * Uses installation access tokens for secure authentication
 */
export class GitHubAppService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(installationToken: string, owner: string, repo: string) {
    this.octokit = new Octokit({
      auth: installationToken,
    });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Create GitHub App service with installation token
   */
  static async create(
    installationId: number,
    owner: string,
    repo: string): Promise<GitHubAppService> {
    // In production, would fetch installation token from GitHub App
    // For now, assume token is passed via environment or context
    const token = process.env.GITHUB_INSTALLATION_TOKEN;
    if (!token) {
      throw new AuthenticationError('GitHub installation token not configured');
    }

    return new GitHubAppService(token, owner, repo);
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<GHRepository> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        owner: {
          login: data.owner?.login || '',
          id: data.owner?.id || 0,
          avatar_url: data.owner?.avatar_url || '',
        },
        description: data.description,
        html_url: data.html_url,
        default_branch: data.default_branch,
        private: data.private,
      };
    } catch (error) {
      throw new SyncError(`Failed to fetch repository: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new branch for handoff
   */
  async createBranch(featureName: string, baseBranch: string = 'main'): Promise<string> {
    try {
      // Get the SHA of the base branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${baseBranch}`,
      });

      // Create simple feature branch name
      const branchName = `feature/${featureName.toLowerCase().replace(/\s+/g, '-')}`;

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });

      return branchName;
    } catch (error) {
      throw new SyncError(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Commit files to a branch
   */
  async commitFiles(
    branchName: string,
    files: Array<{ path: string; content: string }>,
    commitMessage: string
  ): Promise<string> {
    try {
      let latestSha = '';

      // Get the latest commit SHA on the branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });

      const baseCommitSha = refData.object.sha;

      // Get the tree SHA from the commit
      const { data: commitData } = await this.octokit.rest.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: baseCommitSha,
      });

      const baseTreeSha = commitData.tree.sha;

      // Create array of tree entries for new files
      const treeEntries = files.map((file) => ({
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        content: file.content,
      }));

      // Create new tree with file changes
      const { data: treeData } = await this.octokit.rest.git.createTree({
        owner: this.owner,
        repo: this.repo,
        tree: treeEntries,
        base_tree: baseTreeSha,
      });

      // Create new commit
      const { data: newCommitData } = await this.octokit.rest.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        tree: treeData.sha,
        message: commitMessage,
        parents: [baseCommitSha],
      });

      latestSha = newCommitData.sha;

      // Update the branch reference
      await this.octokit.rest.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
        sha: latestSha,
      });

      return latestSha;
    } catch (error) {
      throw new SyncError(`Failed to commit files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    description: string,
    baseBranch: string = 'main',
    headBranch: string
  ): Promise<GHPullRequest> {
    try {
      const { data } = await this.octokit.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body: description,
        base: baseBranch,
        head: headBranch,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state as 'open' | 'closed',
        draft: data.draft || false,
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || '',
        },
        created_at: data.created_at,
        updated_at: data.updated_at,
        merged_at: data.merged_at,
        merged_by: data.merged_by,
        head: {
          ref: data.head?.ref || '',
          sha: data.head?.sha || '',
        },
        base: {
          ref: data.base?.ref || '',
          sha: data.base?.sha || '',
        },
        html_url: data.html_url,
        labels: data.labels || [],
      };
    } catch (error) {
      throw new SyncError(`Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a file from the repository
   */
  async getFile(path: string, ref: string = 'main'): Promise<GHContentFile> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref,
      });

      if (Array.isArray(data)) {
        throw new SyncError(`Expected file, got directory: ${path}`);
      }

      return {
        path: data.path,
        name: data.name,
        sha: data.sha,
        size: data.size,
        type: data.type as 'file' | 'dir' | 'submodule' | 'symlink',
        content: data.type === 'file' && 'content' in data ? atob(data.content) : undefined,
        url: data.url,
        html_url: data.html_url || '',
        download_url: data.download_url,
      };
    } catch (error) {
      throw new SyncError(`Failed to get file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update or create a file
   */
  async updateFile(
    path: string,
    content: string,
    commitMessage: string,
    branch: string = 'main'
  ): Promise<string> {
    try {
      let sha: string | undefined;

      try {
        const existingFile = await this.getFile(path, branch);
        const existingContent = (await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: branch,
        })) as any;
        sha = existingContent.data.sha;
      } catch {
        // File doesn't exist, will create new
      }

      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });

      return data.commit.sha || '';
    } catch (error) {
      throw new SyncError(`Failed to update file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List files in a directory
   */
  async listDirectory(path: string = '', ref: string = 'main'): Promise<GHContentFile[]> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path || '.',
        ref,
      });

      if (!Array.isArray(data)) {
        throw new SyncError(`Expected directory, got file: ${path}`);
      }

      return data.map((item: any) => ({
        path: item.path,
        name: item.name,
        sha: item.sha,
        size: item.size,
        type: item.type as 'file' | 'dir' | 'submodule' | 'symlink',
        url: item.url,
        html_url: item.html_url || '',
        download_url: item.download_url,
      }));
    } catch (error) {
      throw new SyncError(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get pull request information
   */
  async getPullRequest(prNumber: number): Promise<GHPullRequest> {
    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state as 'open' | 'closed',
        draft: data.draft || false,
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || '',
        },
        created_at: data.created_at,
        updated_at: data.updated_at,
        merged_at: data.merged_at,
        merged_by: data.merged_by,
        head: {
          ref: data.head?.ref || '',
          sha: data.head?.sha || '',
        },
        base: {
          ref: data.base?.ref || '',
          sha: data.base?.sha || '',
        },
        html_url: data.html_url,
        labels: data.labels || [],
      };
    } catch (error) {
      throw new SyncError(`Failed to get pull request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if PR is merged
   */
  async isPullRequestMerged(prNumber: number): Promise<boolean> {
    try {
      const response = await this.octokit.rest.pulls.checkIfMerged({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      return response.status === 204; // 204 No Content means it's merged
    } catch {
      return false;
    }
  }

  /**
   * Create a check run (for CI/CD status)
   */
  async createCheckRun(
    headSha: string,
    name: string,
    status: 'queued' | 'in_progress' | 'completed' = 'in_progress',
    conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out'
  ): Promise<number> {
    try {
      const { data } = await this.octokit.rest.checks.create({
        owner: this.owner,
        repo: this.repo,
        name,
        head_sha: headSha,
        status,
        conclusion: conclusion || undefined,
      });

      return data.id;
    } catch (error) {
      throw new SyncError(`Failed to create check run: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton helper for backward compatibility
export const githubAppService = {
  async getInstallationToken(orgId: string, repoFullName: string): Promise<string> {
    // TODO: Implement GitHub App installation token fetching
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_INSTALLATION_TOKEN;
    if (!token) {
      throw new AuthenticationError('GitHub token not configured');
    }
    return token;
  },

  async getRepoInfo(token: string, repoFullName: string) {
    const [owner, repo] = repoFullName.split('/');
    const service = new GitHubAppService(token, owner, repo);
    const repoData = await service.getRepository();
    return {
      defaultBranch: repoData.default_branch,
      defaultBranchSha: '', // Would need to fetch from refs
    };
  },

  async createBranch(token: string, repoFullName: string, branchName: string, baseSha: string) {
    const [owner, repo] = repoFullName.split('/');
    const service = new GitHubAppService(token, owner, repo);
    await service.createBranch(branchName, baseSha);
  },

  async commitFiles(
    token: string,
    repoFullName: string,
    branchName: string,
    files: Array<{ path: string; content: string }>,
    message: string
  ): Promise<string> {
    const [owner, repo] = repoFullName.split('/');
    const service = new GitHubAppService(token, owner, repo);
    return await service.commitFiles(branchName, files, message);
  },

  async createPullRequest(
    token: string,
    repoFullName: string,
    headBranch: string,
    baseBranch: string,
    title: string,
    body: string
  ): Promise<string> {
    const [owner, repo] = repoFullName.split('/');
    const service = new GitHubAppService(token, owner, repo);
    const pr = await service.createPullRequest(title, body, baseBranch, headBranch);
    return pr.html_url;
  },
};
