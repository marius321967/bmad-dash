import { parseFrontmatter } from '../frontmatter';

describe('parseFrontmatter', () => {
  it('parses title, status and updated from a frontmatter block', () => {
    const raw = `---
title: My PRD
status: approved
updated: 2024-01-20
---
# body
`;
    expect(parseFrontmatter(raw)).toEqual({
      title: 'My PRD',
      status: 'approved',
      updated: '2024-01-20',
    });
  });

  it('returns null when there is no frontmatter block', () => {
    expect(parseFrontmatter('# just a heading\n')).toBeNull();
  });

  it('last-wins for duplicate keys (uniqueKeys: false)', () => {
    const raw = `---
title: First
title: Second
status: draft
---
`;
    expect(parseFrontmatter(raw)?.title).toBe('Second');
  });

  it('drops non-string status values', () => {
    const raw = `---
title: Weird
status: 123
---
`;
    expect(parseFrontmatter(raw)?.status).toBeUndefined();
  });

  it('normalizes stepsCompleted to numbers, accepting digit strings', () => {
    const raw = `---
stepsCompleted: [1, 2, 3]
---
`;
    expect(parseFrontmatter(raw)?.stepsCompleted).toEqual([1, 2, 3]);
  });

  it('normalizes digit-string stepsCompleted entries to numbers', () => {
    const raw = `---
stepsCompleted: ['1', '2', '3']
---
`;
    expect(parseFrontmatter(raw)?.stepsCompleted).toEqual([1, 2, 3]);
  });

  it('drops malformed stepsCompleted values', () => {
    const raw = `---
stepsCompleted: [1, 'x']
---
`;
    expect(parseFrontmatter(raw)?.stepsCompleted).toBeUndefined();
  });

  it('exposes brainstorming workflow fields', () => {
    const raw = `---
selected_approach: 'progressive-flow'
ideas_generated: [17]
---
`;
    expect(parseFrontmatter(raw)).toMatchObject({
      selectedApproach: 'progressive-flow',
      ideasGenerated: [17],
    });
  });

  it('keeps empty brainstorming fields as empty (not undefined)', () => {
    const raw = `---
selected_approach: ''
ideas_generated: []
---
`;
    const fm = parseFrontmatter(raw);
    expect(fm?.selectedApproach).toBe('');
    expect(fm?.ideasGenerated).toEqual([]);
  });
});
