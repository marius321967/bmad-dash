import type {
  Artifact,
  DashboardData,
  Epic,
  RibbonCounts,
  Story,
  StoryStatus,
} from '../scanner/types';
import { relativeTime } from '../scanner/util';
import { styles } from './styles';

/** Order and display labels for the five story-status ribbon segments. */
const RIBBON_SEGMENTS: Array<{ key: keyof RibbonCounts; label: string }> = [
  { key: 'done', label: 'done' },
  { key: 'review', label: 'review' },
  { key: 'in-progress', label: 'in progress' },
  { key: 'ready-for-dev', label: 'ready for dev' },
  { key: 'backlog', label: 'backlog' },
];

/** Escape a string for safe interpolation into HTML text and attributes. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** CSS class for a story-status segment. */
function segClass(status: StoryStatus | keyof RibbonCounts): string {
  switch (status) {
    case 'done':
      return 'seg-done';
    case 'review':
      return 'seg-review';
    case 'in-progress':
      return 'seg-in-progress';
    case 'ready-for-dev':
      return 'seg-ready';
    case 'backlog':
      return 'seg-backlog';
  }
}

/** Percentage string for a count out of a total, e.g. 87.9 or 100. */
function pct(count: number, total: number): string {
  const value = (count / total) * 100;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Tooltip for a legend item: the story ids in that status bucket, capped at 10
 * with a "+N more" suffix. Titles are long, so only ids are shown.
 */
function legendTooltip(status: StoryStatus, stories: Story[]): string {
  const ids = stories.map((s) => s.id);
  const shown = ids.slice(0, 10);
  const more = ids.length - shown.length;
  let text = `${status}: ${shown.join(', ')}`;
  if (more > 0) {
    text += `, +${more} more`;
  }
  return text;
}

/**
 * Render a status ribbon plus legend. Zero-count segments and legend items are
 * omitted. When there are no stories at all, a single full-width backlog-grey
 * segment is shown with no legend.
 */
function renderRibbon(
  counts: RibbonCounts,
  ariaPrefix: string,
  stories: Story[]
): string {
  const total = RIBBON_SEGMENTS.reduce((sum, s) => sum + counts[s.key], 0);

  const segments = RIBBON_SEGMENTS.filter((s) => counts[s.key] > 0);
  const segHtml =
    segments.length === 0
      ? '<div class="ribbon-seg seg-backlog" style="width: 100%;"></div>'
      : segments
          .map(
            (s) =>
              `<div class="ribbon-seg ${segClass(s.key)}" style="width: ${pct(
                counts[s.key],
                total
              )}%;"></div>`
          )
          .join('');

  const ariaParts = segments.map(
    (s) => `${counts[s.key]} ${s.label}`
  );
  const ariaLabel =
    ariaParts.length === 0
      ? `${ariaPrefix}: no stories`
      : `${ariaPrefix}: ${ariaParts.join(', ')}`;

  const legendHtml =
    segments.length === 0
      ? ''
      : `<div class="ribbon-legend">${segments
          .map((s) => {
            const bucketStories = stories.filter((st) => st.status === s.key);
            const tooltip = legendTooltip(s.key, bucketStories);
            return `<span class="legend-item" title="${esc(
              tooltip
            )}"><span class="legend-dot ${segClass(
              s.key
            )}"></span>${counts[s.key]} ${s.label}</span>`;
          })
          .join('')}</div>`;

  return `<div class="ribbon" role="img" aria-label="${esc(
    ariaLabel
  )}">${segHtml}</div>${legendHtml}`;
}

/** Display label for a story status, e.g. 'ready-for-dev' → 'ready for dev'. */
function storyStatusLabel(status: StoryStatus): string {
  return RIBBON_SEGMENTS.find((s) => s.key === status)?.label ?? status;
}

/** "8-10-some-slug" → "8.10". */
function storyNumLabel(id: string): string {
  const match = /^(\d+)-(\d+)-/.exec(id);
  return match ? `${match[1]}.${match[2]}` : id;
}

function renderStory(story: Story): string {
  const label = storyNumLabel(story.id);
  const status = storyStatusLabel(story.status);
  const clickable = story.path !== undefined;
  const cls = `story-row${story.status === 'done' ? ' story-row-done' : ''}${
    clickable ? ' story-row-clickable' : ''
  }`;
  const openAttrs = clickable
    ? ` data-open-path="${esc(story.path as string)}" tabindex="0"`
    : '';
  const ariaLabel = clickable
    ? `Story ${label}: ${story.title} — ${status}. Click to open ${story.path}`
    : `Story ${label}: ${story.title} — ${status}`;

  return `<div class="${cls}" role="listitem"${openAttrs} aria-label="${esc(ariaLabel)}">
  <span class="story-dot ${segClass(story.status)}"></span>
  <span class="story-num">${esc(label)}</span>
  <span class="story-title">${esc(story.title)}</span>
  <span class="story-status">${esc(status)}</span>
</div>`;
}

function renderEpic(epic: Epic, sprintStatusPath: string): string {
  const badgeLabel =
    epic.status === 'done'
      ? 'Done'
      : epic.status === 'in-progress'
        ? 'In progress'
        : 'Backlog';
  const badge =
    epic.status === 'done'
      ? `<span class="badge badge-done" title="${esc(
          epic.statusReason
        )}">Done</span>`
      : epic.status === 'in-progress'
        ? `<span class="badge badge-in-progress" title="${esc(
            epic.statusReason
          )}">In progress</span>`
        : `<span class="badge badge-backlog" title="${esc(
            epic.statusReason
          )}">Backlog</span>`;

  const total = RIBBON_SEGMENTS.reduce((sum, s) => sum + epic.ribbon[s.key], 0);
  const ribbonHtml =
    epic.status !== 'done' && total > 0
      ? `<div class="epic-ribbon-block">${renderRibbon(
          epic.ribbon,
          `Epic ${epic.num} stories`,
          epic.stories
        )}</div>`
      : '';

  const clickable = epic.statusLine !== undefined;
  const openAttrs = clickable
    ? ` data-open-path="${esc(sprintStatusPath)}" data-open-line="${epic.statusLine}"`
    : '';
  const cls = clickable ? 'epic-row epic-row-clickable' : 'epic-row';
  const tabindex = clickable ? ' tabindex="0"' : '';
  const ariaLabel = clickable
    ? `Epic ${epic.num}: ${epic.title} — ${badgeLabel}. Click to open sprint status at line ${epic.statusLine}`
    : `Epic ${epic.num}: ${epic.title} — ${badgeLabel}`;

  const storiesHtml =
    epic.stories.length === 0
      ? ''
      : `<div class="story-list" role="list">${epic.stories
          .map(renderStory)
          .join('')}</div>`;

  return `<div class="${cls}"${openAttrs}${tabindex} aria-label="${esc(ariaLabel)}">
  <div class="epic-row-top">
    <div class="epic-name">
      <span class="epic-num">Epic ${epic.num}</span>
      <span class="epic-title">${esc(epic.title)}</span>
    </div>
    ${badge}
  </div>${ribbonHtml}${storiesHtml}
</div>`;
}

function renderArtifact(artifact: Artifact): string {
  const badge =
    artifact.status === 'completed'
      ? `<span class="badge badge-completed" title="${esc(
          artifact.statusReason
        )}">Completed</span>`
      : `<span class="badge badge-in-progress" title="${esc(
          artifact.statusReason
        )}">In progress</span>`;
  const badgeLabel = artifact.status === 'completed' ? 'Completed' : 'In progress';
  const ariaLabel = `${artifact.type}: ${artifact.title} — ${badgeLabel}. ${artifact.statusReason}. Click to open ${artifact.path}`;

  return `<div class="artifact-card" role="listitem" tabindex="0" data-open-path="${esc(
    artifact.path
  )}" aria-label="${esc(ariaLabel)}">
  <div class="artifact-card-left">
    <span class="artifact-type">${esc(artifact.type)}</span>
    <span class="artifact-title">${esc(artifact.title)}</span>
  </div>
  ${badge}
</div>`;
}

function renderActivityRow(
  type: string,
  title: string,
  time?: string,
  commitUrl?: string
): string {
  const timeHtml = time ? `<span class="activity-time">${esc(time)}</span>` : '';
  const titleInner = `<span class="activity-type">${esc(type)}</span>${esc(title)}`;
  const titleHtml = commitUrl
    ? `<a href="#" class="activity-title activity-link" data-url="${esc(
        commitUrl
      )}">${titleInner}</a>`
    : `<span class="activity-title">${titleInner}</span>`;
  return `<div class="activity-row">
  ${titleHtml}
  ${timeHtml}
</div>`;
}

function renderSprintChange(change: { date: string; title: string; path: string }): string {
  const ariaLabel = `Sprint change proposal: ${change.title} — ${change.date}. Click to open ${change.path}`;
  return `<div class="activity-row activity-row-clickable" tabindex="0" data-open-path="${esc(
    change.path
  )}" aria-label="${esc(ariaLabel)}">
  <span class="activity-title"><span class="activity-type">${esc(
    change.date
  )}</span>${esc(change.title)}</span>
</div>`;
}

/**
 * Render the complete standalone HTML document for the Project Map webview.
 * `nonce` is used on the refresh script tag to satisfy the CSP.
 */
export function renderDashboard(data: DashboardData, nonce: string): string {
  const { progress } = data;

  const allStories = data.epics.flatMap((e) => e.stories);
  const progressRibbon = renderRibbon(progress.ribbon, 'All stories', allStories);

  const epicsHtml = data.epics
    .map((e) => renderEpic(e, data.sprintStatusPath))
    .join('');

  const artifactsHtml = data.artifacts.map(renderArtifact).join('');

  const activityHtml =
    data.activity.length === 0
      ? '<div class="activity-empty">No recent activity</div>'
      : data.activity
          .map((a) => renderActivityRow(a.type, a.title, a.time, a.commitUrl))
          .join('');

  const sprintHtml =
    data.sprintChanges.length === 0
      ? ''
      : `<section class="section panel sprint-changes" aria-label="Sprint change proposals">
  <h2 class="panel-label">Sprint changes</h2>
  <div class="activity-list">
    ${data.sprintChanges.map(renderSprintChange).join('')}
  </div>
</section>`;

  // Panels are rendered as flat siblings in canonical order; the CSS
  // multi-column layout on .dashboard distributes them across columns.
  const panels = [
    `<section class="section panel" aria-label="Overall project progress">
  <h2 class="panel-label">Progress</h2>
  <div class="summary-line">
    <span class="summary-primary">${progress.epicsDone} of ${progress.epicsTotal} epics done</span>
    <span class="summary-secondary">${progress.storiesDone} of ${progress.storiesTotal} stories done</span>
  </div>
  ${progressRibbon}
</section>`,
    `<section class="section panel" aria-label="Epics">
  <h2 class="panel-label">Epics</h2>
  <div class="epic-list">
    ${epicsHtml}
  </div>
</section>`,
    `<section class="section panel" aria-label="Available artifacts">
  <h2 class="panel-label">Artifacts</h2>
  <div class="artifact-list" role="list">
    ${artifactsHtml}
  </div>
</section>`,
    `<section class="section panel" aria-label="Recent activity">
  <h2 class="panel-label">Recent activity</h2>
  <div class="activity-list">
    ${activityHtml}
  </div>
</section>`,
    sprintHtml,
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<title>${esc(data.projectName)} — Project Map</title>
<style>${styles}</style>
</head>
<body>
<div class="content-area">

  <div class="page-header">
    <h1 class="page-title">Project Map</h1>
    <button class="refresh-btn" id="refresh-btn" aria-label="Refresh Project Map">
      <span class="refresh-icon">↺</span>
    </button>
    <span class="last-updated" title="${esc(data.generatedAt)}">Updated ${esc(relativeTime(data.generatedAt))}</span>
  </div>

  <div class="dashboard">
    ${panels.join('\n\n')}
  </div>

</div>
<script nonce="${nonce}">
(function () {
  var dash = document.querySelector('.dashboard');
  if (!dash) return;
  var GAP = 16;

  // Column count by viewport width; matches the CSS breakpoints (840/1228px)
  // so each column stays >= ~372px wide (>= ~340px usable panel width).
  function columnCount(w) {
    if (w < 840) return 1;
    if (w < 1228) return 2;
    return 3;
  }

  // Canonical panel order, captured once from the server-rendered flat DOM.
  // layout() moves panels into .dash-col columns; re-deriving order from the
  // DOM on later runs would read column-major order and change the greedy
  // assignment (visible as panels jumping around after tab switches, which
  // fire resize events).
  var panels = Array.prototype.slice.call(dash.querySelectorAll('.panel'));

  function layout() {
    while (dash.firstChild) dash.removeChild(dash.firstChild);

    var n = columnCount(window.innerWidth);
    var cols = [];
    for (var i = 0; i < n; i++) {
      var col = document.createElement('div');
      col.className = 'dash-col';
      dash.appendChild(col);
      cols.push(col);
    }

    // Stack all panels in the first column so each renders at the target
    // column width, then measure real heights.
    panels.forEach(function (p) { cols[0].appendChild(p); });
    var heights = panels.map(function (p) { return p.getBoundingClientRect().height; });

    // Greedy, order-preserving assignment to the currently-shortest column.
    var colH = new Array(n).fill(0);
    panels.forEach(function (p, i) {
      var idx = 0;
      for (var j = 1; j < n; j++) {
        if (colH[j] < colH[idx]) idx = j;
      }
      cols[idx].appendChild(p);
      colH[idx] += heights[i] + GAP;
    });
  }

  layout();
  window.addEventListener('resize', layout);
})();
</script>
<script nonce="${nonce}">
(function () {
  var vscode = (typeof acquireVsCodeApi === 'function') ? acquireVsCodeApi() : null;
  var btn = document.getElementById('refresh-btn');
  if (btn && vscode) {
    btn.addEventListener('click', function () {
      vscode.postMessage({ type: 'refresh' });
    });
  }

  var dash = document.querySelector('.dashboard');
  if (dash && vscode) {
    function openMessage(el) {
      var msg = { type: 'open', path: el.getAttribute('data-open-path') };
      var line = el.getAttribute('data-open-line');
      if (line) { msg.line = Number(line); }
      return msg;
    }
    dash.addEventListener('click', function (e) {
      var link = e.target.closest('.activity-link');
      if (link) {
        e.preventDefault();
        vscode.postMessage({
          type: 'openExternal',
          url: link.getAttribute('data-url'),
        });
        return;
      }
      var el = e.target.closest('[data-open-path]');
      if (el) { vscode.postMessage(openMessage(el)); }
    });
    dash.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') { return; }
      var el = e.target.closest('[data-open-path]');
      if (el) {
        e.preventDefault();
        vscode.postMessage(openMessage(el));
      }
    });
  }
})();
</script>
</body>
</html>
`;
}
