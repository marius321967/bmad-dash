import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { runTests } from '@vscode/test-electron';

const appDir = __dirname;
const repoListPath = path.resolve(appDir, '..', 'bmad-v6-projects.txt');
const extensionDevelopmentPath = path.resolve(appDir, '..', '..', 'dist');
const extensionTestsPath = path.resolve(appDir, 'out', 'extensionTest.js');
const reposDir = '/tmp/smoke-repos';
const userDataDir = '/tmp/smoke-userdata';

fs.mkdirSync(reposDir, { recursive: true });

function cloneRepo(url: string): string {
  const repoName = url.split('/').pop()!.replace(/\.git$/, '');
  const repoPath = path.join(reposDir, repoName);
  if (fs.existsSync(repoPath)) {
    fs.rmSync(repoPath, { recursive: true, force: true });
  }
  execSync(`git clone --depth 1 ${url} ${repoPath}`);
  return repoPath;
}

async function runSmokeForRepo(url: string): Promise<void> {
  const repoName = url.split('/').pop()!.replace(/\.git$/, '');
  const repoPath = cloneRepo(url);
  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [
      repoPath,
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--user-data-dir=${path.join(userDataDir, repoName)}`,
    ],
  });
}

function readRepoList(): string[] {
  return fs
    .readFileSync(repoListPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

async function main(): Promise<void> {
  const repoArg = process.argv.find((a) => a.startsWith('--repo='));
  const repos = repoArg ? [repoArg.slice(7)] : readRepoList();

  if (repoArg) {
    await runSmokeForRepo(repoArg.slice(7));
    console.log(`[PASS] ${repoArg.slice(7)}`);
    return;
  }

  const results: { repo: string; status: 'pass' | 'fail'; error?: string }[] = [];

  for (const url of repos) {
    try {
      await runSmokeForRepo(url);
      console.log(`[PASS] ${url}`);
      results.push({ repo: url, status: 'pass' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FAIL] ${url}: ${message}`);
      results.push({ repo: url, status: 'fail', error: message });
    }
  }

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.length - passed;

  console.log('\nSummary:');
  for (const result of results) {
    console.log(`  ${result.status.toUpperCase()} ${result.repo}`);
  }
  console.log(`${passed} passed, ${failed} failed out of ${results.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
