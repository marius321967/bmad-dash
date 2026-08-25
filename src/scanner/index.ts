import * as path from 'node:path';
import { DashboardData, Epic, ProgressSummary } from './types';
import { loadConfig } from './config';
import { loadSprintStatus } from './sprintStatus';
import { buildEpics } from './epics';
import { loadArtifacts } from './artifacts';
import { loadSprintChanges } from './sprintChanges';
import { loadActivity } from './activity';

export { NotBmadV6Error } from './errors';
export { loadConfig } from './config';

function computeProgress(epics: Epic[]): ProgressSummary {
  const ribbon: ProgressSummary['ribbon'] = {
    done: 0,
    review: 0,
    'in-progress': 0,
    'ready-for-dev': 0,
    backlog: 0,
  };
  let storiesTotal = 0;
  let storiesDone = 0;
  for (const epic of epics) {
    for (const story of epic.stories) {
      storiesTotal++;
      ribbon[story.status]++;
      if (story.status === 'done') {
        storiesDone++;
      }
    }
  }
  return {
    epicsDone: epics.filter((epic) => epic.status === 'done').length,
    epicsTotal: epics.length,
    storiesDone,
    storiesTotal,
    ribbon,
  };
}

/**
 * Scans a BMAD v6 repository from disk and produces the DashboardData model.
 * Throws NotBmadV6Error when the repo is not a BMAD v6 repo.
 */
export function scanRepo(repoRoot: string): DashboardData {
  const config = loadConfig(repoRoot);
  const sprintStatusPath = path.join(
    config.implementationArtifacts,
    'sprint-status.yaml'
  );
  const sprintStatus = loadSprintStatus(sprintStatusPath);
  const epics = buildEpics(
    sprintStatus.epicStatuses,
    sprintStatus.storyStatuses,
    path.join(config.planningArtifacts, 'epics'),
    config.implementationArtifacts,
    repoRoot,
    sprintStatus.epicLines
  );

  return {
    projectName: sprintStatus.project ?? config.projectName,
    progress: computeProgress(epics),
    epics,
    artifacts: loadArtifacts(config.planningArtifacts, config.outputFolder, repoRoot),
    activity: loadActivity(repoRoot, config.outputFolder),
    sprintChanges: loadSprintChanges(config.planningArtifacts, repoRoot),
    sprintStatusPath: path.relative(repoRoot, sprintStatusPath),
    generatedAt: new Date().toISOString(),
  };
}
