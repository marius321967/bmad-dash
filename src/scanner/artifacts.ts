import * as fs from 'node:fs';
import * as path from 'node:path';
import { Artifact, ArtifactBadge } from './types';
import { Frontmatter, parseFrontmatter } from './frontmatter';
import { deSlug, h1 } from './util';

const TERMINAL_STATUSES = new Set(['final', 'approved', 'complete', 'completed', 'done']);

const RESEARCH_STEPS = [1, 2, 3, 4, 5, 6];

/** Internal result of status inference: the badge plus why it was chosen. */
interface StatusInference {
  status: ArtifactBadge;
  reason: string;
}

function mapStatus(status: string): StatusInference {
  const terminal = TERMINAL_STATUSES.has(status.toLowerCase());
  return {
    status: terminal ? 'completed' : 'in-progress',
    reason: `Frontmatter status: "${status}" (${
      terminal ? 'a terminal status' : 'not a terminal status'
    })`,
  };
}

/** Research: complete when stepsCompleted covers all six workflow steps. */
function researchStatus(fm: Frontmatter | null): StatusInference {
  const steps = fm?.stepsCompleted;
  if (steps === undefined) {
    // No workflow frontmatter — a plain-authored deep-dive doc, not a lifecycle doc.
    return {
      status: 'completed',
      reason: 'No status field or workflow tracking — treated as a completed reference document',
    };
  }
  const complete = RESEARCH_STEPS.every((n) => steps.includes(n));
  return complete
    ? {
        status: 'completed',
        reason: `All ${RESEARCH_STEPS.length} research workflow steps completed (stepsCompleted: ${steps.join(
          ', '
        )})`,
      }
    : {
        status: 'in-progress',
        reason: `Research workflow incomplete: stepsCompleted covers ${steps.join(
          ', '
        )} of ${RESEARCH_STEPS.length} steps`,
      };
}

/** Brainstorming: complete when the final step wrote a chosen approach or ideas. */
function brainstormingStatus(fm: Frontmatter | null): StatusInference {
  const hasApproach = typeof fm?.selectedApproach === 'string' && fm.selectedApproach.length > 0;
  const hasIdeas = Array.isArray(fm?.ideasGenerated) && fm.ideasGenerated.length > 0;
  if (hasApproach || hasIdeas) {
    return {
      status: 'completed',
      reason: 'Session finalized in frontmatter (selected_approach / ideas_generated recorded)',
    };
  }
  if (fm?.selectedApproach === undefined && fm?.ideasGenerated === undefined) {
    // No workflow frontmatter — a plain-authored deep-dive doc, not a lifecycle doc.
    return {
      status: 'completed',
      reason: 'No status field or workflow tracking — treated as a completed reference document',
    };
  }
  return {
    status: 'in-progress',
    reason: 'Session unfinished: no finalized approach or ideas recorded in frontmatter',
  };
}

function inferStatus(type: string, fm: Frontmatter | null): StatusInference {
  if (fm?.status) {
    return mapStatus(fm.status);
  }
  if (type === 'Research') {
    return researchStatus(fm);
  }
  if (type === 'Brainstorming') {
    return brainstormingStatus(fm);
  }
  return {
    status: 'in-progress',
    reason:
      'No status field — PRD/Brief/UX/Architecture documents are treated as in progress until explicitly marked terminal',
  };
}

function listMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => name !== 'index.md')
    .filter((name) => !/^implementation-readiness-report-/.test(name))
    .map((name) => path.join(dir, name));
}

function listSubdirs(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** Picks the first existing candidate file inside a folder. */
function pickMain(folder: string, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const file = path.join(folder, candidate);
    if (fs.existsSync(file)) {
      return file;
    }
  }
  return undefined;
}

function titleFor(filePath: string, frontmatterTitle: string | undefined): string {
  if (frontmatterTitle) {
    return frontmatterTitle;
  }
  const heading = h1(filePath);
  if (heading) {
    return heading;
  }
  return deSlug(path.basename(filePath, '.md'));
}

function artifactFrom(filePath: string, type: string, repoRoot: string): Artifact {
  const raw = fs.readFileSync(filePath, 'utf8');
  const frontmatter = parseFrontmatter(raw);
  const inferred = inferStatus(type, frontmatter);
  return {
    type,
    title: titleFor(filePath, frontmatter?.title),
    status: inferred.status,
    statusReason: inferred.reason,
    path: path.relative(repoRoot, filePath),
    updated: frontmatter?.updated,
  };
}

interface ArtifactSource {
  type: string;
  filePath: string;
}

function collectSources(planningArtifacts: string, outputFolder: string): ArtifactSource[] {
  const sources: ArtifactSource[] = [];

  for (const sub of listSubdirs(path.join(planningArtifacts, 'prds'))) {
    const main = pickMain(path.join(planningArtifacts, 'prds', sub), ['prd.md']);
    if (main) {
      sources.push({ type: 'PRD', filePath: main });
    }
  }
  for (const sub of listSubdirs(path.join(planningArtifacts, 'briefs'))) {
    const main = pickMain(path.join(planningArtifacts, 'briefs', sub), ['brief.md']);
    if (main) {
      sources.push({ type: 'Brief', filePath: main });
    }
  }
  for (const sub of listSubdirs(path.join(planningArtifacts, 'ux-designs'))) {
    const main = pickMain(path.join(planningArtifacts, 'ux-designs', sub), [
      'DESIGN.md',
      'EXPERIENCE.md',
    ]);
    if (main) {
      sources.push({ type: 'UX', filePath: main });
    }
  }

  const architecture = path.join(planningArtifacts, 'architecture.md');
  if (fs.existsSync(architecture)) {
    sources.push({ type: 'Architecture', filePath: architecture });
  }

  for (const file of listMarkdown(path.join(planningArtifacts, 'research'))) {
    sources.push({ type: 'Research', filePath: file });
  }
  for (const file of listMarkdown(path.join(outputFolder, 'brainstorming'))) {
    sources.push({ type: 'Brainstorming', filePath: file });
  }

  return sources;
}

/** Scans all artifact folders and returns artifacts sorted by `updated` desc. */
export function loadArtifacts(
  planningArtifacts: string,
  outputFolder: string,
  repoRoot: string
): Artifact[] {
  const artifacts = collectSources(planningArtifacts, outputFolder).map((source) =>
    artifactFrom(source.filePath, source.type, repoRoot)
  );
  artifacts.sort((a, b) => {
    if (a.updated && b.updated) {
      return b.updated.localeCompare(a.updated);
    }
    if (a.updated) {
      return -1;
    }
    if (b.updated) {
      return 1;
    }
    return 0;
  });
  return artifacts;
}
