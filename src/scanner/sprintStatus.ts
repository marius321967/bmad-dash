import * as fs from 'node:fs';
import YAML from 'yaml';
import { EpicStatus, StoryStatus } from './types';

const EPIC_STATUSES = new Set<EpicStatus>(['backlog', 'in-progress', 'done']);
const STORY_STATUSES = new Set<StoryStatus>([
  'backlog',
  'ready-for-dev',
  'in-progress',
  'review',
  'done',
]);

export interface SprintStatusData {
  project?: string;
  epicStatuses: Map<number, EpicStatus>;
  storyStatuses: Map<string, StoryStatus>;
  /** 1-based line of each `epic-N:` key in the raw yaml text. */
  epicLines: Map<number, number>;
}

/**
 * Extracts a status from a development_status value, which is either a plain
 * status string or an object carrying a `status` field. Returns undefined for
 * anything unrecognised so it is excluded from the model.
 */
function statusOf(value: unknown, allowed: Set<string>): string | undefined {
  const candidate =
    typeof value === 'string' ? value : (value as { status?: unknown } | null)?.status;
  if (typeof candidate === 'string' && allowed.has(candidate)) {
    return candidate;
  }
  return undefined;
}

/**
 * Scans the raw yaml text for the first line matching `^\s*epic-N\s*:` and
 * records its 1-based line number. Used to reveal the epic in the editor.
 */
function epicLineNumbers(raw: string): Map<number, number> {
  const lines = raw.split('\n');
  const map = new Map<number, number>();
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s*epic-(\d+)\s*:/.exec(lines[i]);
    if (match) {
      const num = Number(match[1]);
      if (!map.has(num)) {
        map.set(num, i + 1);
      }
    }
  }
  return map;
}

/**
 * Parses sprint-status.yaml. The installer emits a known malformed line
 * (`project: bmad-easyproject_key: NOKEY`) that makes the whole document fail
 * to parse, so it is repaired deterministically before parsing.
 */
export function loadSprintStatus(filePath: string): SprintStatusData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const repaired = raw.replace(
    'project: bmad-easyproject_key: NOKEY',
    'project: bmad-easy\nproject_key: NOKEY'
  );
  const doc = YAML.parse(repaired) as {
    project?: unknown;
    development_status?: Record<string, unknown>;
  };

  const epicStatuses = new Map<number, EpicStatus>();
  const storyStatuses = new Map<string, StoryStatus>();
  const epicLines = epicLineNumbers(raw);

  for (const [key, value] of Object.entries(doc.development_status ?? {})) {
    if (key.endsWith('-retrospective')) {
      continue;
    }
    const epicMatch = /^epic-(\d+)$/.exec(key);
    if (epicMatch) {
      const status = statusOf(value, EPIC_STATUSES);
      if (status) {
        epicStatuses.set(Number(epicMatch[1]), status as EpicStatus);
      }
      continue;
    }
    if (/^\d+-\d+-/.test(key)) {
      const status = statusOf(value, STORY_STATUSES);
      if (status) {
        storyStatuses.set(key, status as StoryStatus);
      }
    }
  }

  return {
    project: typeof doc.project === 'string' ? doc.project : undefined,
    epicStatuses,
    storyStatuses,
    epicLines,
  };
}
