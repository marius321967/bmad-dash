/**
 * Shared CSS for the Project Map webview. Colors are driven by the active VS
 * Code theme via --vscode-* variables (mapped through the --dash-* tokens
 * below), with dark-theme hex fallbacks so the dashboard never regresses on
 * minimal or older themes. Browser-chrome and side-nav styles are
 * intentionally omitted (web-app concepts, not webview concepts).
 */
export const styles = `
  :root {
    --dash-canvas-bg: var(--vscode-editor-background, #0D0D11);
    --dash-fg: var(--vscode-foreground, #EDECF5);
    --dash-muted: var(--vscode-descriptionForeground, #8D8CA0);
    --dash-dim: var(--vscode-disabledForeground, #6B6B7E);
    --dash-panel-bg: var(--vscode-editorWidget-background, #16161C);
    --dash-surface-bg: color-mix(in srgb, var(--vscode-editorWidget-background, #16161C) 88%, var(--vscode-foreground, #EDECF5));
    --dash-border: var(--vscode-widget-border, var(--vscode-panel-border, #1E1E26));
    --dash-badge-border: var(--vscode-widget-border, #2B2B38);
    --dash-accent: var(--vscode-focusBorder, #7B6EE8);
    --dash-accent-fg: var(--vscode-textLink-foreground, #7B6EE8);
    --dash-status-done: var(--vscode-charts-green, #3ECF8E);
    --dash-status-review: var(--vscode-charts-purple, #7B6EE8);
    --dash-status-progress: var(--vscode-charts-orange, #F2A944);
    --dash-status-ready: var(--vscode-charts-blue, #4D8DEE);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family), 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--dash-canvas-bg);
    color: var(--dash-fg);
  }

  /* Content area */
  .content-area {
    display: flex;
    flex-direction: column;
    background: var(--dash-canvas-bg);
  }

  /* Page header */
  .page-header {
    padding: 24px 32px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--dash-border);
  }
  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.75rem;
    color: var(--dash-fg);
  }
  .refresh-btn {
    background: transparent;
    border: none;
    color: var(--dash-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .refresh-btn:hover { color: var(--dash-fg); }
  .refresh-icon {
    font-size: 15px;
    display: inline-block;
  }
  .last-updated {
    font-size: 0.75rem;
    color: var(--dash-muted);
  }

  /* Responsive multi-column dashboard. Panels are flat siblings in the markup;
     a small inline script (see renderDashboard) measures real panel heights and
     distributes them into .dash-col columns, so the column count adapts to the
     viewport width. Breakpoints (840/1228px) keep each column >= ~372px wide
     (>= ~340px usable panel width). */
  .dashboard {
    padding: 24px 40px 40px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .dash-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Self-contained dashboard panel */
  .panel {
    background: var(--dash-panel-bg);
    border-radius: 12px;
    padding: 16px;
  }

  /* Reduce horizontal padding on narrow viewports so 1-column isn't cramped. */
  @media (max-width: 839px) {
    .dashboard { padding: 24px 24px 40px; }
  }
  .panel-label {
    font-size: 0.75rem;
    color: var(--dash-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
    margin-bottom: 12px;
  }

  /* ---- Overall progress summary ---- */
  .summary-line {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 12px;
  }
  .summary-primary {
    font-size: 1rem;
    font-weight: 600;
    color: var(--dash-fg);
  }
  .summary-secondary {
    font-size: 0.75rem;
    color: var(--dash-muted);
  }

  /* Status ribbon (story-status distribution bar, GitHub-language-bar model) */
  .ribbon {
    display: flex;
    height: 6px;
    border-radius: 9999px;
    overflow: hidden;
    width: 100%;
  }
  .ribbon-seg { height: 100%; }
  .ribbon-seg + .ribbon-seg { margin-left: 2px; }
  .seg-done        { background: var(--dash-status-done); }
  .seg-review      { background: var(--dash-status-review); }
  .seg-in-progress { background: var(--dash-status-progress); }
  .seg-ready       { background: var(--dash-status-ready); }
  .seg-backlog     { background: var(--dash-muted); opacity: 0.35; }

  .ribbon-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    color: var(--dash-muted);
  }
  .legend-dot {
    width: 8px; height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  /* ---- Epic rows ---- */
  .epic-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .epic-row {
    background: var(--dash-surface-bg);
    border-radius: 12px;
    padding: 10px 16px;
  }
  .epic-row-clickable {
    cursor: pointer;
    border: 1px solid transparent;
  }
  .epic-row-clickable:hover { border-color: var(--dash-accent); }
  .epic-row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .epic-name {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }
  .epic-num {
    font-size: 0.75rem;
    color: var(--dash-muted);
    font-weight: 500;
    flex-shrink: 0;
  }
  .epic-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--dash-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .epic-ribbon-block {
    margin-top: 10px;
  }

  /* ---- Story rows (inside an epic row) ---- */
  .story-list {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
  }
  .story-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 0.8125rem;
  }
  .story-row-clickable { cursor: pointer; }
  .story-row-clickable:hover { border-color: var(--dash-accent); }
  .story-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
  }
  .story-num {
    color: var(--dash-dim);
    font-size: 0.75rem;
    min-width: 28px;
    flex-shrink: 0;
  }
  .story-title {
    color: var(--dash-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .story-status {
    color: var(--dash-muted);
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .story-row-done .story-num,
  .story-row-done .story-title,
  .story-row-done .story-status {
    color: var(--dash-dim);
  }

  /* Status badges */
  .badge {
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 0.75rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .badge-completed,
  .badge-done {
    border: 1px solid var(--dash-badge-border);
    background: transparent;
    color: var(--dash-muted);
  }
  .badge-in-progress {
    border: 1px solid var(--dash-status-progress);
    background: color-mix(in srgb, var(--dash-status-progress) 8%, transparent);
    color: var(--dash-status-progress);
  }
  .badge-backlog {
    border: 1px solid var(--dash-badge-border);
    background: transparent;
    color: var(--dash-dim);
  }

  /* ---- Artifact cards ---- */
  .artifact-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .artifact-card {
    background: var(--dash-surface-bg);
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }
  .artifact-card:hover { border-color: var(--dash-accent); }

  .artifact-card-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .artifact-type {
    font-size: 0.75rem;
    color: var(--dash-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .artifact-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--dash-fg);
  }

  /* ---- Recent activity ---- */
  .activity-list {
    display: flex;
    flex-direction: column;
  }
  .activity-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 4px;
    border-bottom: 1px solid var(--dash-border);
    font-size: 0.875rem;
  }
  .activity-row:last-child { border-bottom: none; }
  .activity-row-clickable { cursor: pointer; }
  .activity-row-clickable:hover .activity-title { color: var(--dash-accent-fg); }
  .activity-title {
    color: var(--dash-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .activity-type { color: var(--dash-muted); font-size: 0.75rem; margin-right: 8px; }
  .activity-link {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  .activity-link:hover { color: var(--dash-accent-fg); }
  .activity-time {
    color: var(--dash-muted);
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .activity-empty { color: var(--dash-muted); font-size: 0.875rem; padding: 8px 4px; }

  /* ---- Sprint changes (minor, bottom) ---- */
  .sprint-changes .activity-title { color: var(--dash-muted); }
  .sprint-changes .activity-type { color: var(--dash-dim); }
`;
