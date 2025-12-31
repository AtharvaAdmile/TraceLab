import axios from 'axios';
import { logService } from './logService';

export interface FileContent {
  path: string;
  name: string;
  content: string;
  type: 'file' | 'dir';
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface PullRequestInfo {
  number: number;
  title: string;
  state: string;
  author: string;
  created_at: string;
  merged_at: string | null;
  files_changed: string[];
  reviews: PRReview[];
}

export interface PRReview {
  user: string;
  state: string; // APPROVED, CHANGES_REQUESTED, COMMENTED
  submitted_at: string;
  body: string;
}

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
});

export const parseGithubUrl = (url: string) => {
  const regex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = url.match(regex);
  if (match) {
    return { owner: match[1], repo: match[2].replace('.git', '') };
  }
  return null;
};

export const fetchRepoMetadata = async (owner: string, repo: string) => {
  const response = await githubApi.get(`/repos/${owner}/${repo}`);
  return response.data;
};

export const fetchCommitHistory = async (owner: string, repo: string, limit: number = 30): Promise<CommitInfo[]> => {
  logService.log('INFO', 'GITHUB', `Fetching commit history...`);
  const response = await githubApi.get(`/repos/${owner}/${repo}/commits?per_page=${limit}`);

  const commits: CommitInfo[] = await Promise.all(
    response.data.map(async (commit: any) => {
      // Fetch detailed commit info to get file changes
      let files: string[] = [];
      try {
        const detailResponse = await githubApi.get(`/repos/${owner}/${repo}/commits/${commit.sha}`);
        files = detailResponse.data.files?.map((f: any) => f.filename) || [];
      } catch (e) {
        // Skip file details if rate limited
      }

      return {
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0], // First line only
        author: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || '',
        files,
      };
    })
  );

  logService.log('INFO', 'GITHUB', `Retrieved ${commits.length} commits`);
  return commits;
};

export const fetchPullRequests = async (owner: string, repo: string, limit: number = 20): Promise<PullRequestInfo[]> => {
  logService.log('INFO', 'GITHUB', `Fetching pull requests...`);
  const response = await githubApi.get(`/repos/${owner}/${repo}/pulls?state=all&per_page=${limit}`);

  const prs: PullRequestInfo[] = await Promise.all(
    response.data.map(async (pr: any) => {
      // Fetch files changed in this PR
      let filesChanged: string[] = [];
      let reviews: PRReview[] = [];

      try {
        const filesResponse = await githubApi.get(`/repos/${owner}/${repo}/pulls/${pr.number}/files`);
        filesChanged = filesResponse.data.map((f: any) => f.filename);

        const reviewsResponse = await githubApi.get(`/repos/${owner}/${repo}/pulls/${pr.number}/reviews`);
        reviews = reviewsResponse.data.map((r: any) => ({
          user: r.user?.login || 'Unknown',
          state: r.state,
          submitted_at: r.submitted_at || '',
          body: r.body || '',
        }));
      } catch (e) {
        // Skip details if rate limited
      }

      return {
        number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user?.login || 'Unknown',
        created_at: pr.created_at,
        merged_at: pr.merged_at,
        files_changed: filesChanged,
        reviews,
      };
    })
  );

  logService.log('INFO', 'GITHUB', `Retrieved ${prs.length} pull requests with reviews`);
  return prs;
};


export const fetchFileContent = async (owner: string, repo: string, path: string) => {
  const response = await githubApi.get(`/repos/${owner}/${repo}/contents/${path}`);
  if (Array.isArray(response.data)) {
    return null; // It's a directory
  }
  // Content is base64 encoded
  const content = atob(response.data.content);
  return content;
};

export const fetchRepoContents = async (owner: string, repo: string): Promise<FileContent[]> => {
  try {
    logService.log('INFO', 'GITHUB', `Starting fetch for ${owner}/${repo}`);
    const repoData = await fetchRepoMetadata(owner, repo);
    const defaultBranch = repoData.default_branch;

    const treeResponse = await githubApi.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    const tree = treeResponse.data.tree;

    const relevantFiles = tree.filter((item: any) => item.type === 'blob' && shouldIncludeFile(item.path));
    logService.log('INFO', 'GITHUB', `Found ${relevantFiles.length} relevant files in structure`);

    // Limit to 50 files to prevent overwhelming the LLM and hitting rate limits too fast
    const fileLimit = 50;
    const filesToFetch = relevantFiles.slice(0, fileLimit);

    logService.log('INFO', 'GITHUB', `Fetching content for ${filesToFetch.length} files...`);

    // Fetch all contents in parallel
    const contents = await Promise.all(
      filesToFetch.map(async (item: any) => {
        try {
          const content = await fetchFileContent(owner, repo, item.path);
          if (content) {
            logService.log('INFO', 'GITHUB', `Fetched: ${item.path}`);
            return {
              path: item.path,
              name: item.path.split('/').pop() || '',
              content: content,
              type: 'file' as const,
            };
          }
        } catch (e: any) {
          logService.log('WARN', 'GITHUB', `Failed to fetch: ${item.path}`, e.message);
        }
        return null;
      })
    );

    const result = contents.filter((c): c is FileContent => c !== null);
    logService.log('INFO', 'GITHUB', `Successfully retrieved ${result.length} files`);
    return result;
  } catch (error: any) {
    logService.log('ERROR', 'GITHUB', `Fetch failed`, error.message);
    if (error.response?.status === 403) {
      if (error.response.headers['x-ratelimit-remaining'] === '0') {
        throw new Error('GitHub API rate limit exceeded. Please add a VITE_GITHUB_TOKEN to your .env file.');
      }
      throw new Error('Access to GitHub repository forbidden (403). Ensure the repository is public or your token is valid.');
    }
    throw error;
  }
};



const shouldIncludeFile = (path: string) => {
  const healthcareKeywords = ['patient', 'glucose', 'dose', 'encrypt', 'auth', 'medical', 'fda', 'iec'];
  const excludePatterns = ['node_modules', 'venv', '.git', '.min.js', '.bundle.js', 'package-lock.json', '.ico', '.png', '.jpg'];

  const isExcluded = excludePatterns.some(pattern => path.includes(pattern));
  if (isExcluded) return false;

  const isDoc = path.endsWith('.md') || path.endsWith('.txt') || path.includes('/docs/');
  const isCode = path.endsWith('.py') || path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.c') || path.endsWith('.cpp');

  if (!isDoc && !isCode) return false;

  // Priority 1: Healthcare-Critical
  const hasKeyword = healthcareKeywords.some(kw => path.toLowerCase().includes(kw));
  if (hasKeyword) return true;

  // Priority 2: Config & Docs
  if (isDoc || path.includes('.github/workflows')) return true;

  return false;
};


export const generateDigest = (
  files: FileContent[],
  commits?: CommitInfo[],
  prs?: PullRequestInfo[]
) => {
  const MAX_DIGEST_SIZE = 120000; // Increased slightly for metadata
  let digest = '';

  // Add commit history section
  if (commits && commits.length > 0) {
    digest += `# COMMIT HISTORY (Recent ${commits.length} commits)\n\n`;
    for (const commit of commits.slice(0, 15)) {
      digest += `- [${commit.sha}] ${commit.message} (by ${commit.author} on ${commit.date.split('T')[0]})\n`;
      if (commit.files.length > 0) {
        digest += `  Files: ${commit.files.slice(0, 5).join(', ')}${commit.files.length > 5 ? '...' : ''}\n`;
      }
    }
    digest += '\n---\n\n';
  }

  // Add PR history section
  if (prs && prs.length > 0) {
    digest += `# PULL REQUESTS (Recent ${prs.length} PRs)\n\n`;
    for (const pr of prs.slice(0, 10)) {
      const status = pr.merged_at ? 'MERGED' : pr.state.toUpperCase();
      digest += `## PR #${pr.number}: ${pr.title} [${status}]\n`;
      digest += `Author: ${pr.author} | Created: ${pr.created_at.split('T')[0]}\n`;
      if (pr.files_changed.length > 0) {
        digest += `Files: ${pr.files_changed.slice(0, 5).join(', ')}${pr.files_changed.length > 5 ? '...' : ''}\n`;
      }
      if (pr.reviews.length > 0) {
        digest += `Reviews:\n`;
        for (const review of pr.reviews) {
          digest += `  - ${review.user}: ${review.state}\n`;
        }
      }
      digest += '\n';
    }
    digest += '---\n\n';
  }

  // Add file contents
  digest += `# SOURCE CODE FILES\n\n`;
  for (const file of files) {
    const section = `## File: ${file.path}\n\n${file.content}\n\n---\n\n`;
    if (digest.length + section.length > MAX_DIGEST_SIZE) {
      digest += `\n... [Digest truncated due to size limits] ...\n`;
      break;
    }
    digest += section;
  }

  return digest;
};