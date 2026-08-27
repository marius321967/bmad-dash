/**
 * Local fixture server for the Project Map dashboard. Serves the rendered
 * dashboard with mock data in a plain browser so DESIGN (CSS/theme) changes
 * can be reviewed without launching VS Code.
 *
 * Usage: npx tsx test/visual/server.ts
 */
import { createServer } from 'node:http';
import { fixture, themeBodyClass, themeCss, themes } from './fixture';

const PORT = 8742;
const THEME_NAMES = Object.keys(themes);

/** Resolve a ?theme= value, falling back to the 2026 default for unknown/missing. */
function resolveTheme(query: string | undefined): string {
  return THEME_NAMES.includes(query ?? '') ? (query as string) : '2026-dark';
}

/** Fixed theme-switcher bar, clearly separate from the dashboard. */
function switcher(active: string): string {
  const links = THEME_NAMES.map(
    (name) =>
      `<a href="/?theme=${name}"${name === active ? ' class="active"' : ''}>${name}</a>`
  ).join('');
  return `<style>
  #fixture-theme-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #1e1e1e; color: #ccc;
    font: 12px/1.4 system-ui, sans-serif;
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; border-bottom: 1px solid #333;
  }
  #fixture-theme-bar a { color: #4da0ff; text-decoration: none; }
  #fixture-theme-bar a.active { color: #fff; font-weight: 600; }
  body { padding-top: 32px; }
</style>
<div id="fixture-theme-bar"><span>Fixture theme:</span>${links}</div>`;
}

// tsx runs this as CommonJS (tsconfig module: commonjs), so require works. A
// query-string dynamic import does NOT bust tsx/esbuild's module cache, so we
// drop every src/webview module (renderDashboard.ts and its styles.ts import)
// from require.cache each request to re-evaluate fresh — edits appear on
// browser refresh without restarting the server.
function renderDashboard(): typeof import('../../src/webview/renderDashboard') {
  for (const key of Object.keys(require.cache)) {
    if (key.includes('src/webview')) delete require.cache[key];
  }
  return require('../../src/webview/renderDashboard.ts');
}

function render(themeName: string): string {
  const html = renderDashboard().renderDashboard(fixture, 'fixture');
  return html
    .replace('</head>', `${themeCss(themeName)}\n</head>`)
    .replace('<body>', `<body class="${themeBodyClass[themeName]}">`)
    .replace('</body>', `${switcher(themeName)}\n</body>`);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const themeName = resolveTheme(url.searchParams.get('theme') ?? undefined);
  const html = render(themeName);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`Fixture server: http://localhost:${PORT}`);
  for (const name of THEME_NAMES) {
    console.log(`  ${name}: http://localhost:${PORT}/?theme=${name}`);
  }
});
