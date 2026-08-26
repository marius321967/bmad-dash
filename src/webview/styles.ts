/**
 * Shared CSS for the Project Map webview. Palette matches the dark VS Code
 * theme and the original mockup; browser-chrome and side-nav styles are
 * intentionally omitted (web-app concepts, not webview concepts).
 */
export const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #0D0D11;
    color: #EDECF5;
  }

  /* Content area */
  .content-area {
    display: flex;
    flex-direction: column;
    background: #0D0D11;
  }

  /* Page header */
  .page-header {
    padding: 24px 32px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #1E1E26;
  }
  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.75rem;
    color: #EDECF5;
  }
  .refresh-btn {
    background: transparent;
    border: none;
    color: #8D8CA0;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .refresh-btn:hover { color: #EDECF5; }
  .refresh-icon {
    font-size: 15px;
    display: inline-block;
  }
  .last-updated {
    font-size: 0.75rem;
    color: #8D8CA0;
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
    background: #16161C;
    border-radius: 12px;
    padding: 16px;
  }

  /* Reduce horizontal padding on narrow viewports so 1-column isn't cramped. */
  @media (max-width: 839px) {
    .dashboard { padding: 24px 24px 40px; }
  }
  .panel-label {
    font-size: 0.75rem;
    color: #8D8CA0;
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
    color: #EDECF5;
  }
  .summary-secondary {
    font-size: 0.75rem;
    color: #8D8CA0;
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
  .seg-done        { background: #3ECF8E; }
  .seg-review      { background: #7B6EE8; }
  .seg-in-progress { background: #F2A944; }
  .seg-ready       { background: #4D8DEE; }
  .seg-backlog     { background: #8D8CA0; opacity: 0.35; }

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
    color: #8D8CA0;
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
    background: #1E1E26;
    border-radius: 12px;
    padding: 10px 16px;
  }
  .epic-row-clickable {
    cursor: pointer;
    border: 1px solid transparent;
  }
  .epic-row-clickable:hover { border-color: #7B6EE8; }
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
    color: #8D8CA0;
    font-weight: 500;
    flex-shrink: 0;
  }
  .epic-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #EDECF5;
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
  .story-row-clickable:hover { border-color: #7B6EE8; }
  .story-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
  }
  .story-num {
    color: #6B6B7E;
    font-size: 0.75rem;
    min-width: 28px;
    flex-shrink: 0;
  }
  .story-title {
    color: #EDECF5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .story-status {
    color: #8D8CA0;
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .story-row-done .story-num,
  .story-row-done .story-title,
  .story-row-done .story-status {
    color: #6B6B7E;
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
    border: 1px solid #2B2B38;
    background: transparent;
    color: #8D8CA0;
  }
  .badge-in-progress {
    border: 1px solid #F2A944;
    background: rgba(242,169,68,0.08);
    color: #F2A944;
  }
  .badge-backlog {
    border: 1px solid #2B2B38;
    background: transparent;
    color: #6B6B7E;
  }

  /* ---- Artifact cards ---- */
  .artifact-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .artifact-card {
    background: #1E1E26;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }
  .artifact-card:hover { border-color: #7B6EE8; }

  .artifact-card-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .artifact-type {
    font-size: 0.75rem;
    color: #8D8CA0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .artifact-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #EDECF5;
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
    border-bottom: 1px solid #1E1E26;
    font-size: 0.875rem;
  }
  .activity-row:last-child { border-bottom: none; }
  .activity-row-clickable { cursor: pointer; }
  .activity-row-clickable:hover .activity-title { color: #7B6EE8; }
  .activity-title {
    color: #EDECF5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .activity-type { color: #8D8CA0; font-size: 0.75rem; margin-right: 8px; }
  .activity-link {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  .activity-link:hover { color: #7B6EE8; }
  .activity-time {
    color: #8D8CA0;
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .activity-empty { color: #8D8CA0; font-size: 0.875rem; padding: 8px 4px; }

  /* ---- Sprint changes (minor, bottom) ---- */
  .sprint-changes .activity-title { color: #8D8CA0; }
  .sprint-changes .activity-type { color: #6B6B7E; }
`;
