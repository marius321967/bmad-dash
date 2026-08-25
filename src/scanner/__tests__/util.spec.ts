import { deSlug, h1, trimConventionalPrefix, relativeTime } from '../util';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('deSlug', () => {
  it('capitalises each dash-separated word', () => {
    expect(deSlug('7-3-converse-with-the-streaming-agent')).toBe(
      '7 3 Converse With The Streaming Agent'
    );
  });

  it('handles a single word', () => {
    expect(deSlug('setup')).toBe('Setup');
  });
});

describe('h1', () => {
  it('returns the first H1 heading text without the leading hash', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-h1-'));
    try {
      const file = path.join(root, 'doc.md');
      fs.writeFileSync(file, '# Epic 1: First Epic\n\nbody\n', 'utf8');
      expect(h1(file)).toBe('Epic 1: First Epic');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('returns undefined when there is no H1', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-h1-'));
    try {
      const file = path.join(root, 'doc.md');
      fs.writeFileSync(file, '## Story 1.1: Setup\n', 'utf8');
      expect(h1(file)).toBeUndefined();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('trimConventionalPrefix', () => {
  it('strips a scoped conventional-commit prefix', () => {
    expect(trimConventionalPrefix('docs(spec): add thing')).toBe('add thing');
  });

  it('strips an unscoped conventional-commit prefix', () => {
    expect(trimConventionalPrefix('feat: do x')).toBe('do x');
  });

  it('leaves non-conventional subjects untouched', () => {
    expect(trimConventionalPrefix('no prefix here')).toBe('no prefix here');
  });
});

describe('relativeTime', () => {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

  it('returns "just now" for sub-minute diffs', () => {
    expect(relativeTime(iso(30_000))).toBe('just now');
  });

  it('returns singular/plural minutes', () => {
    expect(relativeTime(iso(60_000))).toBe('1 minute ago');
    expect(relativeTime(iso(5 * 60_000))).toBe('5 minutes ago');
  });

  it('returns singular/plural hours', () => {
    expect(relativeTime(iso(3_600_000))).toBe('1 hour ago');
    expect(relativeTime(iso(2 * 3_600_000))).toBe('2 hours ago');
  });

  it('returns "yesterday" for a one-day diff', () => {
    expect(relativeTime(iso(24 * 3_600_000))).toBe('yesterday');
  });

  it('returns plural days for multi-day diffs', () => {
    expect(relativeTime(iso(3 * 24 * 3_600_000))).toBe('3 days ago');
  });
});
