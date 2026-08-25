import YAML from 'yaml';

export interface Frontmatter {
  title?: string;
  status?: string;
  updated?: string;
  /** Research workflow completion receipt: the set of completed steps (1..6). */
  stepsCompleted?: number[];
  /** Brainstorming workflow: the chosen approach, when the session completed. */
  selectedApproach?: string;
  /** Brainstorming workflow: the generated ideas, when the session completed. */
  ideasGenerated?: unknown[];
}

/** Normalizes a `stepsCompleted` value to an array of numbers, accepting digit strings. */
function normalizeStepsCompleted(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const steps: number[] = [];
  for (const item of value) {
    if (typeof item === 'number' && Number.isFinite(item)) {
      steps.push(item);
    } else if (typeof item === 'string' && /^\d+$/.test(item)) {
      steps.push(Number(item));
    } else {
      return undefined;
    }
  }
  return steps;
}

/**
 * Parses YAML frontmatter delimited by `---` fences at the top of a file.
 * Returns null when there is no frontmatter block.
 */
export function parseFrontmatter(raw: string): Frontmatter | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) {
    return null;
  }
  const data = YAML.parse(match[1], { uniqueKeys: false }) as Record<string, unknown> | null;
  if (!data || typeof data !== 'object') {
    return null;
  }
  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
    updated: typeof data.updated === 'string' ? data.updated : undefined,
    stepsCompleted: normalizeStepsCompleted(data.stepsCompleted),
    selectedApproach:
      typeof data.selected_approach === 'string' ? data.selected_approach : undefined,
    ideasGenerated: Array.isArray(data.ideas_generated) ? data.ideas_generated : undefined,
  };
}
