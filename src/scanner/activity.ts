import { execFileSync } from 'node:child_process';
import { ActivityEvent } from './types';
import { relativeTime, trimConventionalPrefix } from './util';

interface GitCommit {
  date: string;
  hash: string;
  subject: string;
  files: string[];
}

/** Parses `git log --pretty=format:%cI%x09%H%x09%s --name-only` output. */
function parseGitLog(output: string): GitCommit[] {
  const commits: GitCommit[] = [];
  let current: GitCommit | null = null;
  for (const line of output.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab !== -1) {
      if (current) {
        commits.push(current);
      }
      const rest = line.slice(tab + 1);
      const tab2 = rest.indexOf('\t');
      const hash = tab2 === -1 ? '' : rest.slice(0, tab2);
      const subject = tab2 === -1 ? rest : rest.slice(tab2 + 1);
      current = { date: line.slice(0, tab), hash, subject, files: [] };
    } else if (line.trim() !== '' && current) {
      current.files.push(line.trim());
    }
  }
  if (current) {
    commits.push(current);
  }
  return commits;
}

/**
 * Normalizes a git remote URL to its web base URL (https://host/org/repo), or
 * undefined when the remote is not normalizable. Handles scp-style SSH
 * (`git@host:org/repo.git`), `ssh://` URLs, and `https://` URLs; strips any
 * credentials and a trailing `.git`.
 */
export function remoteWebBase(remoteUrl: string): string | undefined {
  const url = remoteUrl.trim();
  let host: string;
  let path: string;

  const scp = /^[^@/]+@([^:]+):(.+)$/.exec(url);
  if (scp) {
    host = scp[1];
    path = scp[2];
  } else {
    const m = /^(?:https?|ssh|git):\/\/(?:[^@/]+@)?([^/]+)\/(.+)$/.exec(url);
    if (!m) {
      return undefined;
    }
    host = m[1];
    path = m[2];
  }

  path = path.replace(/\.git$/, '').replace(/\/+$/, '');
  if (!host || !path) {
    return undefined;
  }
  return `https://${host}/${path}`;
}

/**
 * Builds the web URL for a commit from a normalized web base. Bitbucket uses
 * `/commits/<sha>`; GitHub, GitLab and unknown hosts use `/commit/<sha>`.
 */
export function commitUrlFor(webBase: string, sha: string): string {
  const host = new URL(webBase).hostname;
  if (host === 'bitbucket.org') {
    return `${webBase}/commits/${sha}`;
  }
  if (host === 'gitlab.com') {
    return `${webBase}/-/commit/${sha}`;
  }
  return `${webBase}/commit/${sha}`;
}

/** Reads the origin remote URL, or undefined when there is no origin remote. */
function resolveOriginUrl(repoRoot: string): string | undefined {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return undefined;
  }
}

/** Derives an area label from the changed artifact paths. */
function deriveType(files: string[]): string {
  for (const file of files) {
    if (file.includes('sprint-status.yaml')) {
      return 'Sprint';
    }
    if (file.includes('/prds/')) {
      return 'PRD';
    }
    if (file.includes('/ux-designs/')) {
      return 'UX';
    }
    if (file.includes('/epics/')) {
      return 'Epics';
    }
    if (file.includes('/briefs/')) {
      return 'Brief';
    }
    if (file.includes('/research/')) {
      return 'Research';
    }
    if (file.includes('/brainstorming/')) {
      return 'Brainstorming';
    }
    if (file.includes('/test-artifacts/')) {
      return 'Tests';
    }
    if (file.includes('project-context.md')) {
      return 'Context';
    }
    const basename = file.split('/').pop() ?? '';
    if (/^\d+-\d+-/.test(basename)) {
      return 'Stories';
    }
    if (file.includes('/implementation-artifacts/')) {
      return 'Implementation';
    }
    if (file.includes('/planning-artifacts/')) {
      return 'Planning';
    }
  }
  return 'Artifacts';
}

/**
 * Reads recent commits touching the output folder. Degrades to an empty list
 * when git is unavailable or returns nothing.
 */
export function loadActivity(repoRoot: string, outputFolder: string): ActivityEvent[] {
  let output: string;
  try {
    output = execFileSync(
      'git',
      ['log', '--since=3 weeks ago', '--pretty=format:%cI%x09%H%x09%s', '--name-only', '--', outputFolder],
      { cwd: repoRoot, encoding: 'utf8' }
    );
  } catch {
    return [];
  }

  const events: ActivityEvent[] = [];
  const originUrl = resolveOriginUrl(repoRoot);
  const webBase = originUrl ? remoteWebBase(originUrl) : undefined;
  for (const commit of parseGitLog(output)) {
    if (commit.files.length === 0) {
      continue;
    }
    events.push({
      type: deriveType(commit.files),
      title: trimConventionalPrefix(commit.subject),
      time: relativeTime(commit.date),
      date: commit.date,
      commitUrl: webBase ? commitUrlFor(webBase, commit.hash) : undefined,
    });
  }
  events.sort((a, b) => b.date.localeCompare(a.date));
  return events.slice(0, 10);
}
