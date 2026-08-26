import * as fs from 'node:fs';
import * as path from 'node:path';
import TOML from '@iarna/toml';
import { NotBmadV6Error } from './errors';

export interface BmadPaths {
  outputFolder: string;
  planningArtifacts: string;
  implementationArtifacts: string;
  projectName: string;
}

function resolveTemplate(value: string, repoRoot: string): string {
  const expanded = value.replace(/\{project-root\}/g, repoRoot);
  return path.resolve(repoRoot, expanded);
}

/**
 * Reads `_bmad/config.toml` and resolves the artifact folder paths against the
 * repo root. Throws NotBmadV6Error when the repo is not a BMAD v6 repo.
 */
export function loadConfig(repoRoot: string): BmadPaths {
  const configPath = path.join(repoRoot, '_bmad', 'config.toml');
  if (!fs.existsSync(configPath)) {
    throw new NotBmadV6Error(`No _bmad/config.toml found at ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const config = TOML.parse(raw) as {
    core?: { output_folder?: string; project_name?: string };
    modules?: { bmm?: { planning_artifacts?: string; implementation_artifacts?: string } };
  };

  const bmm = config.modules?.bmm;
  if (!bmm?.planning_artifacts || !bmm.implementation_artifacts) {
    throw new NotBmadV6Error(
      `config.toml at ${configPath} is missing [modules.bmm] planning_artifacts/implementation_artifacts`
    );
  }

  const planningArtifacts = resolveTemplate(bmm.planning_artifacts, repoRoot);
  const implementationArtifacts = resolveTemplate(bmm.implementation_artifacts, repoRoot);
  const outputFolder = config.core?.output_folder
    ? resolveTemplate(config.core.output_folder, repoRoot)
    : path.dirname(planningArtifacts);

  return {
    outputFolder,
    planningArtifacts,
    implementationArtifacts,
    projectName: config.core?.project_name ?? path.basename(repoRoot),
  };
}
