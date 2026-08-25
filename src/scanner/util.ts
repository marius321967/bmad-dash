import * as fs from 'node:fs';

/** Capitalises the first letter of each dash-separated word. */
export function deSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Returns the first H1 heading text (without the leading `# `), if any. */
export function h1(filePath: string): string | undefined {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = /^#\s+(.+)$/m.exec(raw);
  return match ? match[1].trim() : undefined;
}

/** Strips a conventional-commit prefix such as `docs(spec): ` from a subject. */
export function trimConventionalPrefix(subject: string): string {
  return subject.replace(/^[a-z]+(\([^)]*\))?:\s*/, '');
}

/** Human relative time for an ISO date string. */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'yesterday';
  }
  return `${days} days ago`;
}
