import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { NotBmadV6Error, loadConfig, scanRepo } from './scanner';
import { DashboardData } from './scanner/types';
import { renderDashboard } from './webview/renderDashboard';

const REFRESH_DEBOUNCE_MS = 300;

/**
 * Owns the single Dash webview panel, the file watcher that keeps it
 * live, and the status bar item. Strict: assumes the VS Code host works and
 * that a detected repo is a valid BMAD v6 repo.
 */
class DashProvider {
  private panel: vscode.WebviewPanel | undefined;
  private watcher: vscode.FileSystemWatcher | undefined;
  private debounceTimer: NodeJS.Timeout | undefined;
  private repoRoot: string | undefined;
  private readonly statusBarItem: vscode.StatusBarItem;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this.statusBarItem.command = 'bmad.showDash';
    this.statusBarItem.text = '$(map) BMAD Dash';
    this.context.subscriptions.push(this.statusBarItem);
  }

  /** First workspace folder that scans as a BMAD v6 repo, with its dashboard data, else undefined. */
  private scanWorkspace(): { repoRoot: string; data: DashboardData } | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      return undefined;
    }
    for (const folder of folders) {
      try {
        return { repoRoot: folder.uri.fsPath, data: scanRepo(folder.uri.fsPath) };
      } catch (err) {
        if (err instanceof NotBmadV6Error) {
          continue;
        }
        throw err;
      }
    }
    return undefined;
  }

  /** First workspace folder that scans as a BMAD v6 repo, else undefined. */
  private findRepoRoot(): string | undefined {
    return this.scanWorkspace()?.repoRoot;
  }

  show(): void {
    let scan: { repoRoot: string; data: DashboardData } | undefined;
    try {
      scan = this.scanWorkspace();
    } catch (err) {
      vscode.window.showErrorMessage(this.errorMessage(err));
      return;
    }
    if (!scan) {
      vscode.window.showWarningMessage('Not a BMAD v6 repo');
      return;
    }
    this.repoRoot = scan.repoRoot;
    this.createOrRevealPanel();
    this.setupWatcher();
    if (!scan.data.hasSprintStatus) {
      vscode.window.showInformationMessage(
        'BMAD Dash: no sprint-status.yaml found — epics and stories will appear here once sprint planning has run.'
      );
    }
    this.render();
  }

  private createOrRevealPanel(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      'bmadDash',
      'BMAD Dash',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.type === 'refresh') {
          this.render();
        } else if (message.type === 'open') {
          this.openPath(message.path, message.line);
        } else if (message.type === 'openExternal') {
          this.openExternal(message.url);
        }
      },
      undefined,
      this.context.subscriptions
    );
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.disposeWatcher();
      },
      undefined,
      this.context.subscriptions
    );
  }

  private render(): void {
    if (!this.panel || !this.repoRoot) {
      return;
    }
    try {
      const data = scanRepo(this.repoRoot);
      const nonce = crypto.randomBytes(16).toString('base64');
      this.panel.webview.html = renderDashboard(data, nonce);
    } catch (err) {
      if (err instanceof NotBmadV6Error) {
        vscode.window.showWarningMessage('Not a BMAD v6 repo');
      } else {
        vscode.window.showErrorMessage(
          `Failed to render dashboard: ${this.errorMessage(err)}`
        );
      }
    }
  }

  private setupWatcher(): void {
    if (this.watcher || !this.repoRoot) {
      return;
    }
    const outputFolder = loadConfig(this.repoRoot).outputFolder;
    const pattern = new vscode.RelativePattern(outputFolder, '**');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
    const schedule = (): void => this.scheduleRefresh();
    this.watcher.onDidChange(schedule, undefined, this.context.subscriptions);
    this.watcher.onDidCreate(schedule, undefined, this.context.subscriptions);
    this.watcher.onDidDelete(schedule, undefined, this.context.subscriptions);
  }

  /**
   * Opens a repo-relative path from the webview. Rejects paths that resolve
   * outside the scanned repo root (webview-origin data flowing into file ops).
   * With a 1-based line, reveals the editor selection at that line.
   */
  private openPath(relPath: unknown, line: unknown): void {
    if (!this.repoRoot || typeof relPath !== 'string') {
      return;
    }
    const resolved = path.resolve(this.repoRoot, relPath);
    const rootPrefix = this.repoRoot.endsWith(path.sep)
      ? this.repoRoot
      : this.repoRoot + path.sep;
    if (resolved !== this.repoRoot && !resolved.startsWith(rootPrefix)) {
      return;
    }
    const uri = vscode.Uri.file(resolved);
    vscode.workspace.openTextDocument(uri).then(
      (doc) => {
        if (typeof line === 'number' && Number.isInteger(line) && line >= 1) {
          const pos = new vscode.Position(line - 1, 0);
          vscode.window.showTextDocument(doc, {
            selection: new vscode.Range(pos, pos),
          });
        } else {
          vscode.window.showTextDocument(doc);
        }
      },
      (err) => {
        vscode.window.showErrorMessage(
          `Failed to open artifact: ${this.errorMessage(err)}`
        );
      }
    );
  }

  /**
   * Opens an external URL from the webview in the system browser. Strict:
   * only `https://` URLs are accepted (webview-origin data flowing into an
   * external-open boundary); anything else is ignored.
   */
  private openExternal(url: unknown): void {
    if (typeof url !== 'string' || !url.startsWith('https://')) {
      return;
    }
    vscode.env.openExternal(vscode.Uri.parse(url));
  }

  private scheduleRefresh(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.render();
    }, REFRESH_DEBOUNCE_MS);
  }

  private disposeWatcher(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  updateStatusBar(): void {
    try {
      if (this.findRepoRoot()) {
        this.statusBarItem.show();
      } else {
        this.statusBarItem.hide();
      }
    } catch {
      this.statusBarItem.hide();
    }
  }

  private errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}

export function activateBmadDash(context: vscode.ExtensionContext): void {
  const provider = new DashProvider(context);
  context.subscriptions.push(
    vscode.commands.registerCommand('bmad.showDash', () => provider.show()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => provider.updateStatusBar())
  );
  provider.updateStatusBar();
}
