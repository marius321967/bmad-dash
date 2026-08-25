import { remoteWebBase, commitUrlFor } from '../activity';

describe('remoteWebBase', () => {
  it('normalizes scp-style SSH remotes', () => {
    expect(remoteWebBase('git@github.com:gv8-control/bmad-playground.git')).toBe(
      'https://github.com/gv8-control/bmad-playground'
    );
  });

  it('normalizes ssh:// remotes', () => {
    expect(
      remoteWebBase('ssh://git@github.com/gv8-control/bmad-playground.git')
    ).toBe('https://github.com/gv8-control/bmad-playground');
  });

  it('normalizes https remotes with a trailing .git', () => {
    expect(
      remoteWebBase('https://github.com/gv8-control/bmad-playground.git')
    ).toBe('https://github.com/gv8-control/bmad-playground');
  });

  it('normalizes https remotes without a trailing .git', () => {
    expect(remoteWebBase('https://github.com/gv8-control/bmad-playground')).toBe(
      'https://github.com/gv8-control/bmad-playground'
    );
  });

  it('strips credentials from https remotes', () => {
    expect(remoteWebBase('https://user:token@github.com/org/repo.git')).toBe(
      'https://github.com/org/repo'
    );
  });

  it('returns undefined for non-normalizable input', () => {
    expect(remoteWebBase('')).toBeUndefined();
    expect(remoteWebBase('not a url')).toBeUndefined();
    expect(remoteWebBase('file:///some/local/path')).toBeUndefined();
  });
});

describe('commitUrlFor', () => {
  it('uses /commit/ for github', () => {
    expect(commitUrlFor('https://github.com/org/repo', 'abc123')).toBe(
      'https://github.com/org/repo/commit/abc123'
    );
  });

  it('uses /-/commit/ for gitlab', () => {
    expect(commitUrlFor('https://gitlab.com/org/repo', 'abc123')).toBe(
      'https://gitlab.com/org/repo/-/commit/abc123'
    );
  });

  it('uses /commits/ for bitbucket', () => {
    expect(commitUrlFor('https://bitbucket.org/org/repo', 'abc123')).toBe(
      'https://bitbucket.org/org/repo/commits/abc123'
    );
  });

  it('uses /commit/ for unknown hosts', () => {
    expect(commitUrlFor('https://git.example.com/org/repo', 'abc123')).toBe(
      'https://git.example.com/org/repo/commit/abc123'
    );
  });
});
