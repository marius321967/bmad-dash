import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { scanRepo, NotBmadV6Error } from '../index';
import { loadSprintStatus } from '../sprintStatus';

function writeFile(root: string, rel: string, content: string): void {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

/**
 * Builds a minimal BMAD v6 fixture tree in a fresh temp dir and returns its
 * root. Includes the known malformed `project: bmad-easyproject_key: NOKEY`
 * line in sprint-status.yaml to exercise the scanner's repair path.
 */
function buildFixtureTree(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-scanner-'));

  writeFile(
    root,
    '_bmad/config.toml',
    `[core]
output_folder = "{project-root}/_bmad-output"
project_name = "Test Project"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
  );

  writeFile(
    root,
    '_bmad/implementation-artifacts/sprint-status.yaml',
    `project: bmad-easyproject_key: NOKEY

development_status:
  epic-1: done
  epic-2: in-progress
  "1-1-setup": done
  "1-2-build": done
  "2-1-design": done
  "2-2-review": review
  "2-3-implement": in-progress
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/epics/epic-1.md',
    `# Epic 1: First Epic

## Story 1.1: Setup the thing
## Story 1.2: Build the thing
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/epics/epic-2.md',
    `# Epic 2: Second Epic

## Story 2.1: Design the thing
## Story 2.2: Review the thing
## Story 2.3: Implement the thing
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/prds/my-prd/prd.md',
    `---
title: My PRD
status: approved
updated: 2024-01-20
---
# My PRD
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/briefs/my-brief/brief.md',
    `---
title: My Brief
status: draft
updated: 2024-01-18
---
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/ux-designs/my-ux/DESIGN.md',
    `---
title: My UX
status: final
updated: 2024-01-16
---
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/architecture.md',
    `---
title: Architecture
status: in-progress
updated: 2024-01-14
---
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/research/research-1.md',
    `---
title: Research One
status: complete
updated: 2024-01-12
---
`
  );

  writeFile(
    root,
    '_bmad-output/brainstorming/brainstorm-1.md',
    `---
title: Brainstorm One
status: review
updated: 2024-01-10
---
`
  );

  writeFile(
    root,
    '_bmad/implementation-artifacts/2-2-review.md',
    `# Story 2.2: Review the thing

Status: review
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/sprint-change-proposal-2024-01-15-foo.md',
    `# Change Foo
`
  );

  writeFile(
    root,
    '_bmad/planning-artifacts/sprint-change-proposal-2024-01-10-bar.md',
    `# Change Bar
`
  );

  return root;
}

describe('scanRepo', () => {
  let root: string;

  beforeEach(() => {
    root = buildFixtureTree();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('repairs the malformed project line and exposes the clean project name', () => {
    const data = scanRepo(root);
    expect(data.projectName).toBe('bmad-easy');
  });

  it('computes the progress summary math', () => {
    const { progress } = scanRepo(root);
    expect(progress.epicsDone).toBe(1);
    expect(progress.epicsTotal).toBe(2);
    expect(progress.storiesDone).toBe(3);
    expect(progress.storiesTotal).toBe(5);
    expect(progress.ribbon).toEqual({
      done: 3,
      review: 1,
      'in-progress': 1,
      'ready-for-dev': 0,
      backlog: 0,
    });
  });

  it('sorts epics in-progress, then backlog, then done, by number within each', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-eorder-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      writeFile(
        root2,
        '_bmad/implementation-artifacts/sprint-status.yaml',
        `development_status:
  epic-1: done
  epic-2: backlog
  epic-3: in-progress
  epic-4: backlog
`
      );
      const { epics } = scanRepo(root2);
      expect(epics.map((e) => e.num)).toEqual([3, 2, 4, 1]);
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('builds epics with titles, statuses, stories and per-epic ribbons', () => {
    const { epics } = scanRepo(root);
    const epic1 = epics.find((e) => e.num === 1);
    const epic2 = epics.find((e) => e.num === 2);

    expect(epic1).toMatchObject({
      title: 'First Epic',
      status: 'done',
    });
    expect(epic1?.stories.map((s) => s.title)).toEqual([
      'Setup the thing',
      'Build the thing',
    ]);
    expect(epic1?.ribbon).toEqual({
      done: 2,
      review: 0,
      'in-progress': 0,
      'ready-for-dev': 0,
      backlog: 0,
    });

    expect(epic2).toMatchObject({
      title: 'Second Epic',
      status: 'in-progress',
    });
    expect(epic2?.stories.map((s) => s.title)).toEqual([
      'Design the thing',
      'Review the thing',
      'Implement the thing',
    ]);
    expect(epic2?.ribbon).toEqual({
      done: 1,
      review: 1,
      'in-progress': 1,
      'ready-for-dev': 0,
      backlog: 0,
    });
  });

  it('sets story.path to the story file when it exists, else undefined', () => {
    const { epics } = scanRepo(root);
    const stories = epics.find((e) => e.num === 2)?.stories ?? [];
    const withFile = stories.find((s) => s.id === '2-2-review');
    const withoutFile = stories.find((s) => s.id === '2-1-design');
    expect(withFile?.path).toBe(
      '_bmad/implementation-artifacts/2-2-review.md'
    );
    expect(withoutFile?.path).toBeUndefined();
  });

  it('gives yaml-sourced epics a status reason from the actual key/value', () => {
    const { epics } = scanRepo(root);
    const epic1 = epics.find((e) => e.num === 1);
    const epic2 = epics.find((e) => e.num === 2);
    expect(epic1?.statusReason).toBe(
      'Status from sprint-status.yaml: "epic-1" = "done"'
    );
    expect(epic2?.statusReason).toBe(
      'Status from sprint-status.yaml: "epic-2" = "in-progress"'
    );
  });

  it('gives stories a status reason from the actual yaml status', () => {
    const { epics } = scanRepo(root);
    const stories = epics.find((e) => e.num === 2)?.stories ?? [];
    const byId = new Map(stories.map((s) => [s.id, s]));
    expect(byId.get('2-1-design')?.statusReason).toBe(
      'Marked "done" in sprint-status.yaml'
    );
    expect(byId.get('2-2-review')?.statusReason).toBe(
      'Marked "review" in sprint-status.yaml'
    );
    expect(byId.get('2-3-implement')?.statusReason).toBe(
      'Marked "in-progress" in sprint-status.yaml'
    );
  });

  it('gives derived epics a status reason describing the derivation', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-derived-reason-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      // epic-3 has stories but no `epic-3:` key, so it is derived.
      writeFile(
        root2,
        '_bmad/implementation-artifacts/sprint-status.yaml',
        'development_status:\n  "3-1-do-thing": done\n  "3-2-other-thing": in-progress\n'
      );
      writeFile(
        root2,
        '_bmad/planning-artifacts/epics/epic-3.md',
        '# Epic 3: Third Epic\n\n## Story 3.1: Do the thing\n## Story 3.2: Other thing\n'
      );
      const { epics } = scanRepo(root2);
      expect(epics).toHaveLength(1);
      expect(epics[0].status).toBe('in-progress');
      expect(epics[0].statusReason).toContain('Derived from its 2 stories');
      expect(epics[0].statusReason).toContain('no "epic-3" key present');
      expect(epics[0].statusReason).toContain('not all stories are done');
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('gives a derived all-done epic a status reason describing the derivation', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-derived-done-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      writeFile(
        root2,
        '_bmad/implementation-artifacts/sprint-status.yaml',
        'development_status:\n  "4-1-do-thing": done\n'
      );
      writeFile(
        root2,
        '_bmad/planning-artifacts/epics/epic-4.md',
        '# Epic 4: Fourth Epic\n\n## Story 4.1: Do the thing\n'
      );
      const { epics } = scanRepo(root2);
      expect(epics).toHaveLength(1);
      expect(epics[0].status).toBe('done');
      expect(epics[0].statusReason).toContain('Derived from its 1 stories');
      expect(epics[0].statusReason).toContain('all 1 are done');
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('sorts stories numerically, not lexicographically', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-sort-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      writeFile(
        root2,
        '_bmad/implementation-artifacts/sprint-status.yaml',
        'development_status:\n  "1-10-tenth": done\n  "1-2-second": done\n'
      );
      const { epics } = scanRepo(root2);
      expect(epics[0].stories.map((s) => s.id)).toEqual([
        '1-2-second',
        '1-10-tenth',
      ]);
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('maps artifact frontmatter statuses to terminal/non-terminal badges', () => {
    const { artifacts } = scanRepo(root);
    const byType = new Map(artifacts.map((a) => [a.type, a]));

    expect(byType.get('PRD')?.status).toBe('completed'); // approved
    expect(byType.get('Brief')?.status).toBe('in-progress'); // draft
    expect(byType.get('UX')?.status).toBe('completed'); // final
    expect(byType.get('Architecture')?.status).toBe('in-progress'); // in-progress
    expect(byType.get('Research')?.status).toBe('completed'); // complete
    expect(byType.get('Brainstorming')?.status).toBe('in-progress'); // review

    expect(byType.get('PRD')?.statusReason).toContain('Frontmatter status: "approved"');
    expect(byType.get('PRD')?.statusReason).toContain('a terminal status');
    expect(byType.get('Brief')?.statusReason).toContain('Frontmatter status: "draft"');
    expect(byType.get('Brief')?.statusReason).toContain('not a terminal status');
  });

  it('lists artifacts sorted by updated date descending with repo-relative paths', () => {
    const { artifacts } = scanRepo(root);
    expect(artifacts.map((a) => a.title)).toEqual([
      'My PRD',
      'My Brief',
      'My UX',
      'Architecture',
      'Research One',
      'Brainstorm One',
    ]);
    expect(artifacts.map((a) => a.path)).toEqual([
      '_bmad/planning-artifacts/prds/my-prd/prd.md',
      '_bmad/planning-artifacts/briefs/my-brief/brief.md',
      '_bmad/planning-artifacts/ux-designs/my-ux/DESIGN.md',
      '_bmad/planning-artifacts/architecture.md',
      '_bmad/planning-artifacts/research/research-1.md',
      '_bmad-output/brainstorming/brainstorm-1.md',
    ]);
  });

  it('parses sprint changes with date from filename, title from H1, sorted desc', () => {
    const { sprintChanges } = scanRepo(root);
    expect(sprintChanges).toEqual([
      {
        date: '2024-01-15',
        title: 'Change Foo',
        path: '_bmad/planning-artifacts/sprint-change-proposal-2024-01-15-foo.md',
      },
      {
        date: '2024-01-10',
        title: 'Change Bar',
        path: '_bmad/planning-artifacts/sprint-change-proposal-2024-01-10-bar.md',
      },
    ]);
  });

  it('throws NotBmadV6Error when _bmad/config.toml is missing', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-empty-'));
    try {
      expect(() => scanRepo(empty)).toThrow(NotBmadV6Error);
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  it('throws NotBmadV6Error when config.toml lacks [modules.bmm]', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-nobmm-'));
    try {
      writeFile(root2, '_bmad/config.toml', '[core]\noutput_folder = "out"\n');
      expect(() => scanRepo(root2)).toThrow(NotBmadV6Error);
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('treats a missing sprint-status.yaml as a normal pre-planning state', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-noyaml-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      const data = scanRepo(root2);
      expect(data.hasSprintStatus).toBe(false);
      expect(data.epics).toEqual([]);
      expect(data.progress.storiesTotal).toBe(0);
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('computes statusLine for epics with a yaml key', () => {
    const { epics } = scanRepo(root);
    expect(epics.find((e) => e.num === 1)?.statusLine).toBe(4);
    expect(epics.find((e) => e.num === 2)?.statusLine).toBe(5);
  });

  it('leaves statusLine undefined for derived epics without a yaml key', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-derived-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      // epic-3 has stories but no `epic-3:` key, so it is derived.
      writeFile(
        root2,
        '_bmad/implementation-artifacts/sprint-status.yaml',
        'development_status:\n  "3-1-do-thing": done\n'
      );
      writeFile(
        root2,
        '_bmad/planning-artifacts/epics/epic-3.md',
        '# Epic 3: Third Epic\n\n## Story 3.1: Do the thing\n'
      );
      const { epics } = scanRepo(root2);
      expect(epics).toHaveLength(1);
      expect(epics[0].num).toBe(3);
      expect(epics[0].statusLine).toBeUndefined();
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('maps an unknown frontmatter status to in-progress', () => {
    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-unknown-'));
    try {
      writeFile(
        root2,
        '_bmad/config.toml',
        `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
      );
      writeFile(
        root2,
        '_bmad/implementation-artifacts/sprint-status.yaml',
        'development_status:\n  epic-1: done\n'
      );
      writeFile(
        root2,
        '_bmad/planning-artifacts/epics/epic-1.md',
        '# Epic 1: First Epic\n'
      );
      writeFile(
        root2,
        '_bmad/planning-artifacts/research/weird.md',
        `---
title: Weird
status: some-unknown-value
updated: 2024-01-01
---
`
      );
      const { artifacts } = scanRepo(root2);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].status).toBe('in-progress');
      expect(artifacts[0].statusReason).toContain('Frontmatter status: "some-unknown-value"');
      expect(artifacts[0].statusReason).toContain('not a terminal status');
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });
 });

describe('flat-file artifacts at the planning-artifacts root', () => {
  function buildFlatFixture(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-flat-'));
    writeFile(
      root,
      '_bmad/config.toml',
      `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
    );
    writeFile(
      root,
      '_bmad/implementation-artifacts/sprint-status.yaml',
      'development_status:\n'
    );
    return root;
  }

  it('recognizes a flat prd.md as a PRD artifact', () => {
    const root = buildFlatFixture();
    try {
      writeFile(
        root,
        '_bmad/planning-artifacts/prd.md',
        `---
title: Flat PRD
status: approved
---
# Flat PRD
`
      );
      const { artifacts } = scanRepo(root);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].type).toBe('PRD');
      expect(artifacts[0].title).toBe('Flat PRD');
      expect(artifacts[0].path).toBe('_bmad/planning-artifacts/prd.md');
      expect(artifacts[0].status).toBe('completed');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('recognizes a flat ux-design-specification.md as a UX artifact', () => {
    const root = buildFlatFixture();
    try {
      writeFile(
        root,
        '_bmad/planning-artifacts/ux-design-specification.md',
        `---
title: Flat UX
status: final
---
# Flat UX
`
      );
      const { artifacts } = scanRepo(root);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].type).toBe('UX');
      expect(artifacts[0].title).toBe('Flat UX');
      expect(artifacts[0].path).toBe('_bmad/planning-artifacts/ux-design-specification.md');
      expect(artifacts[0].status).toBe('completed');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('recognizes flat product-brief-*.md files as Brief artifacts', () => {
    const root = buildFlatFixture();
    try {
      writeFile(
        root,
        '_bmad/planning-artifacts/product-brief-foo-2026-03-13.md',
        `---
title: Flat Brief
status: draft
---
# Flat Brief
`
      );
      const { artifacts } = scanRepo(root);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].type).toBe('Brief');
      expect(artifacts[0].title).toBe('Flat Brief');
      expect(artifacts[0].path).toBe(
        '_bmad/planning-artifacts/product-brief-foo-2026-03-13.md'
      );
      expect(artifacts[0].status).toBe('in-progress');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('collects multiple flat artifacts together with correct types', () => {
    const root = buildFlatFixture();
    try {
      writeFile(root, '_bmad/planning-artifacts/prd.md', '---\ntitle: P\n---\n# P\n');
      writeFile(
        root,
        '_bmad/planning-artifacts/ux-design-specification.md',
        '---\ntitle: U\n---\n# U\n'
      );
      writeFile(
        root,
        '_bmad/planning-artifacts/product-brief-a-2026-01-01.md',
        '---\ntitle: B\n---\n# B\n'
      );
      const { artifacts } = scanRepo(root);
      const types = artifacts.map((a) => a.type).sort();
      expect(types).toEqual(['Brief', 'PRD', 'UX']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not treat unrelated root markdown as flat artifacts', () => {
    const root = buildFlatFixture();
    try {
      writeFile(root, '_bmad/planning-artifacts/epics.md', '# Epics\n');
      writeFile(root, '_bmad/planning-artifacts/notes.md', '# Notes\n');
      const { artifacts } = scanRepo(root);
      expect(artifacts).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not double-count when both canonical and flat layouts exist', () => {
    const root = buildFlatFixture();
    try {
      writeFile(root, '_bmad/planning-artifacts/prds/my-prd/prd.md', '---\ntitle: Sub PRD\n---\n');
      writeFile(root, '_bmad/planning-artifacts/prd.md', '---\ntitle: Flat PRD\n---\n');
      const { artifacts } = scanRepo(root);
      const prds = artifacts.filter((a) => a.type === 'PRD');
      expect(prds).toHaveLength(2);
      expect(prds.map((a) => a.title).sort()).toEqual(['Flat PRD', 'Sub PRD']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('loadSprintStatus', () => {
  it('returns empty statuses when the file does not exist', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-nofile-'));
    try {
      const data = loadSprintStatus(path.join(root, 'sprint-status.yaml'));
      expect(data.epicStatuses.size).toBe(0);
      expect(data.storyStatuses.size).toBe(0);
      expect(data.epicLines.size).toBe(0);
      expect(data.project).toBeUndefined();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('artifact status inference from workflow frontmatter', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-workflow-status-'));
    writeFile(
      root,
      '_bmad/config.toml',
      `[core]
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
planning_artifacts = "{project-root}/_bmad/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad/implementation-artifacts"
`
    );
    writeFile(
      root,
      '_bmad/implementation-artifacts/sprint-status.yaml',
      'development_status:\n  epic-1: done\n'
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function statuses(): Record<string, string> {
    const { artifacts } = scanRepo(root);
    return Object.fromEntries(artifacts.map((a) => [a.title, a.status]));
  }

  function reasons(): Record<string, string> {
    const { artifacts } = scanRepo(root);
    return Object.fromEntries(artifacts.map((a) => [a.title, a.statusReason]));
  }

  it('marks research completed when stepsCompleted covers all six steps', () => {
    writeFile(
      root,
      '_bmad/planning-artifacts/research/research-complete.md',
      `---
stepsCompleted: [1, 2, 3, 4, 5, 6]
---
`
    );
    expect(statuses()['Research Complete']).toBe('completed');
    expect(reasons()['Research Complete']).toContain(
      'All 6 research workflow steps completed'
    );
    expect(reasons()['Research Complete']).toContain('stepsCompleted: 1, 2, 3, 4, 5, 6');
  });

  it('marks research in-progress when stepsCompleted is incomplete', () => {
    writeFile(
      root,
      '_bmad/planning-artifacts/research/research-incomplete.md',
      `---
stepsCompleted: [1, 2, 3, 4, 5]
---
`
    );
    expect(statuses()['Research Incomplete']).toBe('in-progress');
    expect(reasons()['Research Incomplete']).toContain('Research workflow incomplete');
    expect(reasons()['Research Incomplete']).toContain('covers 1, 2, 3, 4, 5 of 6 steps');
  });

  it('marks research completed when there is no workflow frontmatter', () => {
    writeFile(
      root,
      '_bmad/planning-artifacts/research/research-plain.md',
      '# Research Plain\n'
    );
    expect(statuses()['Research Plain']).toBe('completed');
    expect(reasons()['Research Plain']).toContain(
      'No status field or workflow tracking'
    );
  });

  it('marks brainstorming completed when approach or ideas are non-empty', () => {
    writeFile(
      root,
      '_bmad-output/brainstorming/brainstorm-complete.md',
      `---
selected_approach: 'progressive-flow'
ideas_generated: [17]
---
`
    );
    expect(statuses()['Brainstorm Complete']).toBe('completed');
    expect(reasons()['Brainstorm Complete']).toContain('Session finalized in frontmatter');
  });

  it('marks brainstorming in-progress when approach and ideas are empty', () => {
    writeFile(
      root,
      '_bmad-output/brainstorming/brainstorm-incomplete.md',
      `---
selected_approach: ''
ideas_generated: []
---
`
    );
    expect(statuses()['Brainstorm Incomplete']).toBe('in-progress');
    expect(reasons()['Brainstorm Incomplete']).toContain('Session unfinished');
  });

  it('marks brainstorming completed when there is no workflow frontmatter', () => {
    writeFile(
      root,
      '_bmad-output/brainstorming/brainstorm-plain.md',
      '# Brainstorm Plain\n'
    );
    expect(statuses()['Brainstorm Plain']).toBe('completed');
    expect(reasons()['Brainstorm Plain']).toContain(
      'No status field or workflow tracking'
    );
  });

  it('gives explicit status priority over workflow signals', () => {
    writeFile(
      root,
      '_bmad/planning-artifacts/research/research-status.md',
      `---
status: draft
stepsCompleted: [1, 2, 3, 4, 5, 6]
---
`
    );
    expect(statuses()['Research Status']).toBe('in-progress');
    expect(reasons()['Research Status']).toContain('Frontmatter status: "draft"');
    expect(reasons()['Research Status']).toContain('not a terminal status');
  });

  it('treats non-workflow artifacts without a status field as in-progress with a reason', () => {
    writeFile(
      root,
      '_bmad/planning-artifacts/prds/no-status/prd.md',
      `---
title: No Status PRD
---
`
    );
    expect(statuses()['No Status PRD']).toBe('in-progress');
    expect(reasons()['No Status PRD']).toContain('No status field');
  });
});
