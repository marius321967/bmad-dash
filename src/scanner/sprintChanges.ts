import * as fs from 'node:fs';
import * as path from 'node:path';
import { SprintChange } from './types';
import { h1 } from './util';

const PATTERN = /^sprint-change-proposal-(\d{4}-\d{2}-\d{2}).*\.md$/;

/** Scans sprint-change-proposal files directly under planning-artifacts. */
export function loadSprintChanges(
  planningArtifacts: string,
  repoRoot: string
): SprintChange[] {
  const dir = planningArtifacts;
  if (!fs.existsSync(dir)) {
    return [];
  }
  const changes: SprintChange[] = [];
  for (const name of fs.readdirSync(dir)) {
    const match = PATTERN.exec(name);
    if (!match) {
      continue;
    }
    const filePath = path.join(dir, name);
    changes.push({
      date: match[1],
      title: h1(filePath) ?? name,
      path: path.relative(repoRoot, filePath),
    });
  }
  changes.sort((a, b) => b.date.localeCompare(a.date));
  return changes;
}
