import * as fs from 'node:fs';
import * as path from 'node:path';
import { Epic, EpicStatus, RibbonCounts, Story, StoryStatus } from './types';
import { deSlug, h1 } from './util';

const EMPTY_RIBBON: RibbonCounts = {
  done: 0,
  review: 0,
  'in-progress': 0,
  'ready-for-dev': 0,
  backlog: 0,
};

/** Parses `## Story 8.2: Title` headings into a map keyed by "8-2". */
function storyHeadings(epicFile: string): Map<string, string> {
  const headings = new Map<string, string>();
  if (!fs.existsSync(epicFile)) {
    return headings;
  }
  const raw = fs.readFileSync(epicFile, 'utf8');
  const re = /^##\s+Story\s+(\d+)\.(\d+):\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    headings.set(`${match[1]}-${match[2]}`, match[3].trim());
  }
  return headings;
}

function epicTitle(epicFile: string, num: number): string {
  const heading = fs.existsSync(epicFile) ? h1(epicFile) : undefined;
  if (heading) {
    const match = /^Epic\s+\d+:\s*(.+)$/.exec(heading);
    if (match) {
      return match[1].trim();
    }
  }
  return `Epic ${num}`;
}

/**
 * Derives an epic's status and its human-readable reason. When an explicit
 * `epic-N:` status exists in sprint-status.yaml it wins; otherwise the status
 * is derived from the epic's stories (all done → done, some not done →
 * in-progress, none → backlog).
 */
function deriveEpicStatus(
  explicit: EpicStatus | undefined,
  num: number,
  stories: Story[]
): { status: EpicStatus; reason: string } {
  if (explicit) {
    return {
      status: explicit,
      reason: `Status from sprint-status.yaml: "epic-${num}" = "${explicit}"`,
    };
  }
  if (stories.length > 0 && stories.every((s) => s.status === 'done')) {
    return {
      status: 'done',
      reason: `Derived from its ${stories.length} stories in sprint-status.yaml (no "epic-${num}" key present): all ${stories.length} are done`,
    };
  }
  if (stories.length > 0) {
    return {
      status: 'in-progress',
      reason: `Derived from its ${stories.length} stories in sprint-status.yaml (no "epic-${num}" key present): not all stories are done`,
    };
  }
  return {
    status: 'backlog',
    reason: `Derived from its 0 stories in sprint-status.yaml (no "epic-${num}" key present): no stories`,
  };
}

/** Numeric story order parsed from the key prefix ("8-10-x" → [8, 10]). */
function storyOrder(id: string): [number, number] {
  const match = /^(\d+)-(\d+)/.exec(id);
  return match ? [Number(match[1]), Number(match[2])] : [0, 0];
}

/** Display order: active work first, then unstarted, then finished. */
const EPIC_STATUS_ORDER: Record<EpicStatus, number> = {
  'in-progress': 0,
  backlog: 1,
  done: 2,
};

/**
 * Builds the epic list from sprint-status.yaml statuses and the epic markdown
 * files. Story titles come from the epic file's `## Story N.M:` headings,
 * falling back to a de-slugged story id. Story file paths come from
 * `<storiesDir>/<story key>.md`, when that file exists.
 */
export function buildEpics(
  epicStatuses: Map<number, EpicStatus>,
  storyStatuses: Map<string, StoryStatus>,
  epicsDir: string,
  storiesDir: string,
  repoRoot: string,
  epicLines: Map<number, number> = new Map()
): Epic[] {
  const epicNums = new Set<number>(epicStatuses.keys());
  for (const key of storyStatuses.keys()) {
    const match = /^(\d+)-/.exec(key);
    if (match) {
      epicNums.add(Number(match[1]));
    }
  }

  const epics: Epic[] = [];
  for (const num of [...epicNums].sort((a, b) => a - b)) {
    const epicFile = path.join(epicsDir, `epic-${num}.md`);
    const headings = storyHeadings(epicFile);

    const stories: Story[] = [];
    for (const [key, status] of storyStatuses) {
      const match = /^(\d+)-(\d+)-/.exec(key);
      if (!match || Number(match[1]) !== num) {
        continue;
      }
      const headingKey = `${match[1]}-${match[2]}`;
      const title = headings.get(headingKey) ?? deSlug(key);
      const storyFile = path.join(storiesDir, `${key}.md`);
      const storyPath = fs.existsSync(storyFile)
        ? path.relative(repoRoot, storyFile)
        : undefined;
      stories.push({
        id: key,
        title,
        status,
        statusReason: `Marked "${status}" in sprint-status.yaml`,
        path: storyPath,
      });
    }
    stories.sort((a, b) => {
      const [ae, as] = storyOrder(a.id);
      const [be, bs] = storyOrder(b.id);
      return ae - be || as - bs || a.id.localeCompare(b.id);
    });

    const ribbon: RibbonCounts = { ...EMPTY_RIBBON };
    for (const story of stories) {
      ribbon[story.status]++;
    }

    const derived = deriveEpicStatus(epicStatuses.get(num), num, stories);

    epics.push({
      num,
      title: epicTitle(epicFile, num),
      status: derived.status,
      statusReason: derived.reason,
      stories,
      ribbon,
      statusLine: epicLines.get(num),
    });
  }

  epics.sort(
    (a, b) => EPIC_STATUS_ORDER[a.status] - EPIC_STATUS_ORDER[b.status] || a.num - b.num
  );
  return epics;
}
