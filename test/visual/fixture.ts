/**
 * Shared fixture data and theme maps for the visual harness. Used by both
 * render-fixtures.ts (static HTML output) and server.ts (live preview).
 */
import type { DashboardData } from '../../src/scanner/types';

/**
 * Fixture covering every status bucket: all three epic statuses, all five
 * story statuses, both artifact badge states, activity with and without a
 * commit link, and sprint changes.
 */
export const fixture: DashboardData = {
  projectName: 'Fixture Project',
  progress: {
    epicsDone: 1,
    epicsTotal: 3,
    storiesDone: 5,
    storiesTotal: 14,
    ribbon: { done: 5, review: 2, 'in-progress': 2, 'ready-for-dev': 3, backlog: 2 },
  },
  epics: [
    {
      num: 1,
      title: 'Onboarding flow',
      status: 'done',
      statusReason: 'All 4 stories are done',
      statusLine: 3,
      stories: [
        { id: '1-1-welcome-screen', title: 'Welcome screen', status: 'done', statusReason: 'story file marked done', path: 'stories/1.1.welcome-screen.md' },
        { id: '1-2-account-setup', title: 'Account setup wizard', status: 'done', statusReason: 'story file marked done', path: 'stories/1.2.account-setup.md' },
        { id: '1-3-first-run-tour', title: 'First-run guided tour', status: 'done', statusReason: 'story file marked done' },
        { id: '1-4-import-existing-data', title: 'Import existing data', status: 'done', statusReason: 'story file marked done', path: 'stories/1.4.import.md' },
      ],
      ribbon: { done: 4, review: 0, 'in-progress': 0, 'ready-for-dev': 0, backlog: 0 },
    },
    {
      num: 2,
      title: 'Streaming conversation engine',
      status: 'in-progress',
      statusReason: 'Sprint status marks epic in-progress',
      statusLine: 8,
      stories: [
        { id: '2-1-token-streaming', title: 'Token streaming from agent', status: 'done', statusReason: 'story file marked done', path: 'stories/2.1.token-streaming.md' },
        { id: '2-2-tool-call-rendering', title: 'Tool call rendering', status: 'review', statusReason: 'story file marked review', path: 'stories/2.2.tool-call-rendering.md' },
        { id: '2-3-session-resume', title: 'Resume interrupted sessions', status: 'review', statusReason: 'story file marked review', path: 'stories/2.3.session-resume.md' },
        { id: '2-4-rate-limit-backoff', title: 'Rate-limit backoff handling', status: 'in-progress', statusReason: 'story file marked in-progress', path: 'stories/2.4.rate-limit-backoff.md' },
        { id: '2-5-context-window-trim', title: 'Context window trimming', status: 'in-progress', statusReason: 'story file marked in-progress' },
        { id: '2-6-stream-reconnect', title: 'Stream reconnection UX', status: 'ready-for-dev', statusReason: 'story file marked ready-for-dev', path: 'stories/2.6.stream-reconnect.md' },
        { id: '2-7-queued-prompts', title: 'Queued prompts while streaming', status: 'ready-for-dev', statusReason: 'story file marked ready-for-dev', path: 'stories/2.7.queued-prompts.md' },
        { id: '2-8-error-surfacing', title: 'Error surfacing to user', status: 'ready-for-dev', statusReason: 'story file marked ready-for-dev' },
        { id: '2-9-usage-metering', title: 'Usage metering display', status: 'backlog', statusReason: 'no story file found' },
        { id: '2-10-conversation-export', title: 'Conversation export', status: 'backlog', statusReason: 'no story file found' },
      ],
      ribbon: { done: 1, review: 2, 'in-progress': 2, 'ready-for-dev': 3, backlog: 2 },
    },
    {
      num: 3,
      title: 'Plugin marketplace',
      status: 'backlog',
      statusReason: 'No stories from this epic have started',
      stories: [
        { id: '3-1-plugin-registry', title: 'Plugin registry browse', status: 'backlog', statusReason: 'no story file found' },
        { id: '3-2-plugin-install', title: 'One-click plugin install', status: 'backlog', statusReason: 'no story file found' },
      ],
      ribbon: { done: 0, review: 0, 'in-progress': 0, 'ready-for-dev': 0, backlog: 2 },
    },
  ],
  artifacts: [
    { type: 'PRD', title: 'Streaming Agent PRD', status: 'completed', statusReason: 'Frontmatter status is final', path: '_bmad-output/prds/streaming-prd.md' },
    { type: 'Architecture', title: 'Streaming Agent Architecture', status: 'in-progress', statusReason: 'Frontmatter status is draft', path: '_bmad-output/architecture/streaming-arch.md' },
    { type: 'UX', title: 'Conversation UX Spec', status: 'completed', statusReason: 'Frontmatter status is final', path: '_bmad-output/ux/conversation-ux.md' },
    { type: 'Brief', title: 'Product Brief', status: 'in-progress', statusReason: 'Frontmatter status is draft', path: '_bmad-output/briefs/product-brief.md' },
  ],
  activity: [
    { type: 'Epic', title: 'Epic 2 stories moved to review', time: '2 hours ago', date: '2026-08-27T02:00:00Z', commitUrl: 'https://example.com/commit/abc123' },
    { type: 'PRD', title: 'Streaming Agent PRD updated', time: '1 day ago', date: '2026-08-26T09:00:00Z' },
    { type: 'Story', title: '2.4 rate-limit-backoff started', time: '2 days ago', date: '2026-08-25T15:00:00Z', commitUrl: 'https://example.com/commit/def456' },
  ],
  sprintChanges: [
    { date: '2026-08-26', title: 'Split epic 2 into two epics', path: '_bmad-output/sprint-changes/2026-08-26-split-epic-2.md' },
  ],
  sprintStatusPath: '_bmad-output/sprint-status.yaml',
  hasSprintStatus: true,
  generatedAt: new Date().toISOString(),
};

/**
 * --vscode-* variable values for each simulated theme. Values are from the
 * built-in VS Code themes (Default Dark Modern, Default Light Modern, High
 * Contrast dark/light) — the same source the real webview inherits.
 */
export const themes: Record<string, Record<string, string>> = {
  // Dark 2026 (VS Code current default) — all 14 values are direct 2026-dark.json theme overrides (microsoft/vscode main)
  '2026-dark': {
    'vscode-editor-background': '#121314',
    'vscode-foreground': '#bfbfbf',
    'vscode-descriptionForeground': '#8C8C8C',
    'vscode-disabledForeground': '#555555',
    'vscode-editorWidget-background': '#202122',
    'vscode-widget-border': '#2A2B2C',
    'vscode-panel-border': '#2A2B2C',
    'vscode-focusBorder': 'rgba(57, 148, 188, 0.7)',
    'vscode-textLink-foreground': '#48A0C7',
    'vscode-charts-green': '#86CF86',
    'vscode-charts-purple': '#AD80D7',
    'vscode-charts-orange': '#CD861A',
    'vscode-charts-blue': '#57A3F8',
    'vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif',
  },
  // Light 2026 (VS Code current default) — all 14 values are direct 2026-light.json theme overrides (microsoft/vscode main)
  '2026-light': {
    'vscode-editor-background': '#FFFFFF',
    'vscode-foreground': '#202020',
    'vscode-descriptionForeground': '#606060',
    'vscode-disabledForeground': '#BBBBBB',
    'vscode-editorWidget-background': '#FAFAFD',
    'vscode-widget-border': '#E2E2E5',
    'vscode-panel-border': '#F0F1F2',
    'vscode-focusBorder': '#0069CC',
    'vscode-textLink-foreground': '#0069CC',
    'vscode-charts-green': '#388A34',
    'vscode-charts-purple': '#652D90',
    'vscode-charts-orange': '#d18616',
    'vscode-charts-blue': '#1A5CFF',
    'vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif',
  },
  // Default Dark Modern — values from dark_modern.json + color registry (microsoft/vscode main)
  dark: {
    'vscode-editor-background': '#1F1F1F',
    'vscode-foreground': '#CCCCCC',
    'vscode-descriptionForeground': '#9D9D9D',
    'vscode-disabledForeground': 'rgba(204, 204, 204, 0.5)',
    'vscode-editorWidget-background': '#202020',
    'vscode-widget-border': '#313131',
    'vscode-panel-border': '#2B2B2B',
    'vscode-focusBorder': '#0078D4',
    'vscode-textLink-foreground': '#4DAAFC',
    'vscode-charts-green': '#89D185',
    'vscode-charts-purple': '#B180D7',
    'vscode-charts-orange': 'rgba(234, 92, 0, 0.33)',
    'vscode-charts-blue': '#59A4F9',
    'vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif',
  },
  // Default Light Modern — values from light_modern.json + color registry (microsoft/vscode main)
  light: {
    'vscode-editor-background': '#FFFFFF',
    'vscode-foreground': '#3B3B3B',
    'vscode-descriptionForeground': '#3B3B3B',
    'vscode-disabledForeground': 'rgba(97, 97, 97, 0.5)',
    'vscode-editorWidget-background': '#F8F8F8',
    'vscode-widget-border': '#E5E5E5',
    'vscode-panel-border': '#E5E5E5',
    'vscode-focusBorder': '#005FB8',
    'vscode-textLink-foreground': '#005FB8',
    'vscode-charts-green': '#388A34',
    'vscode-charts-purple': '#652D90',
    'vscode-charts-orange': 'rgba(234, 92, 0, 0.33)',
    'vscode-charts-blue': '#0063D3',
    'vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif',
  },
  // Default High Contrast (hc_black) — values from hc_black.json + color registry (microsoft/vscode main).
  // vscode-charts-orange is intentionally omitted: VS Code does not inject it for this theme.
  'hc-dark': {
    'vscode-editor-background': '#000000',
    'vscode-foreground': '#FFFFFF',
    'vscode-descriptionForeground': 'rgba(255, 255, 255, 0.7)',
    'vscode-disabledForeground': '#A5A5A5',
    'vscode-editorWidget-background': '#0C141F',
    'vscode-widget-border': '#6FC3DF',
    'vscode-panel-border': '#6FC3DF',
    'vscode-focusBorder': '#F38518',
    'vscode-textLink-foreground': '#21A6FF',
    'vscode-charts-green': '#89D185',
    'vscode-charts-purple': '#B180D7',
    'vscode-charts-blue': '#59A4F9',
    'vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif',
  },
  // Default High Contrast Light (hc_light) — values from hc_light.json + color registry (microsoft/vscode main).
  // vscode-charts-orange is intentionally omitted: VS Code does not inject it for this theme.
  'hc-light': {
    'vscode-editor-background': '#FFFFFF',
    'vscode-foreground': '#292929',
    'vscode-descriptionForeground': 'rgba(41, 41, 41, 0.7)',
    'vscode-disabledForeground': '#7F7F7F',
    'vscode-editorWidget-background': '#FFFFFF',
    'vscode-widget-border': '#0F4A85',
    'vscode-panel-border': '#0F4A85',
    'vscode-focusBorder': '#006BBD',
    'vscode-textLink-foreground': '#0F4A85',
    'vscode-charts-green': '#374E06',
    'vscode-charts-purple': '#652D90',
    'vscode-charts-blue': '#0063D3',
    'vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif',
  },
};

/** VS Code body class for each simulated theme. */
export const themeBodyClass: Record<string, string> = {
  '2026-dark': 'vscode-dark',
  '2026-light': 'vscode-light',
  dark: 'vscode-dark',
  light: 'vscode-light',
  'hc-dark': 'vscode-high-contrast',
  'hc-light': 'vscode-high-contrast-light',
};

/** Build the <style>:root{...}</style> block injecting --vscode-* vars. */
export function themeCss(themeName: string): string {
  const vars = themes[themeName];
  return `<style>:root { ${Object.entries(vars)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(' ')} }</style>`;
}
