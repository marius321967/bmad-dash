/**
 * DashboardData model — the contract between the scanner (pure TS) and the
 * webview renderer. Covers every panel in the Project Map dashboard.
 */

export type EpicStatus = 'backlog' | 'in-progress' | 'done';

export type StoryStatus =
  | 'backlog'
  | 'ready-for-dev'
  | 'in-progress'
  | 'review'
  | 'done';

/** Per-status story counts that drive the GitHub-language-bar style ribbon. */
export interface RibbonCounts {
  done: number;
  review: number;
  'in-progress': number;
  'ready-for-dev': number;
  backlog: number;
}

export interface Story {
  /** Story key from sprint-status.yaml, e.g. "7-3-converse-with-the-streaming-agent". */
  id: string;
  title: string;
  status: StoryStatus;
  /** Human-readable explanation of why `status` was inferred, shown as a tooltip. */
  statusReason: string;
  /** Repo-relative path to the story file, when it exists. */
  path?: string;
}

export interface Epic {
  num: number;
  title: string;
  status: EpicStatus;
  /** Human-readable explanation of why `status` was inferred, shown as a tooltip. */
  statusReason: string;
  stories: Story[];
  ribbon: RibbonCounts;
  /** 1-based line of the `epic-N:` key in sprint-status.yaml, when present. */
  statusLine?: number;
}

/** Terminal frontmatter statuses map to 'completed', everything else to 'in-progress'. */
export type ArtifactBadge = 'completed' | 'in-progress';

export interface Artifact {
  /** Display type label, e.g. "PRD", "Brief", "UX", "Architecture", "Research", "Brainstorming". */
  type: string;
  title: string;
  status: ArtifactBadge;
  /** Human-readable explanation of why `status` was inferred, shown as a tooltip. */
  statusReason: string;
  /** Repo-relative path, e.g. "_bmad-output/planning-artifacts/prds/prd.md". */
  path: string;
  /** ISO date from frontmatter `updated`, if present. */
  updated?: string;
}

export interface ActivityEvent {
  /** Area label shown as prefix, derived from the changed artifact path. */
  type: string;
  title: string;
  /** Human relative time, e.g. "2 hours ago". */
  time: string;
  /** ISO commit date for sorting. */
  date: string;
  /** Web URL to the commit on the repo's remote, when resolvable. */
  commitUrl?: string;
}

export interface SprintChange {
  /** YYYY-MM-DD parsed from the filename. */
  date: string;
  /** H1 of the proposal file. */
  title: string;
  /** Repo-relative path to the proposal file. */
  path: string;
}

export interface ProgressSummary {
  epicsDone: number;
  epicsTotal: number;
  storiesDone: number;
  storiesTotal: number;
  ribbon: RibbonCounts;
}

export interface DashboardData {
  projectName: string;
  progress: ProgressSummary;
  epics: Epic[];
  artifacts: Artifact[];
  activity: ActivityEvent[];
  sprintChanges: SprintChange[];
  /** Repo-relative path to sprint-status.yaml, for epic click-through. */
  sprintStatusPath: string;
  /** False when sprint-status.yaml does not exist yet (sprint planning not run). */
  hasSprintStatus: boolean;
  /** ISO timestamp of when the scan ran. */
  generatedAt: string;
}
