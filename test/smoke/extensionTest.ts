import * as vscode from 'vscode';

export async function run(): Promise<void> {
  try {
    const extension = vscode.extensions.getExtension('whisker-studio.bmad-dash');
    if (!extension) {
      throw new Error('Extension whisker-studio.bmad-dash not found');
    }

    if (!extension.isActive) {
      await extension.activate();
    }
    if (!extension.isActive) {
      throw new Error('Extension whisker-studio.bmad-dash did not activate');
    }

    try {
      await vscode.commands.executeCommand('bmad.showDash');
    } catch (err) {
      throw new Error(`bmad.showDash command failed: ${String(err)}`);
    }

    await new Promise((r) => setTimeout(r, 500));

    const found = vscode.window.tabGroups.all.some((group) =>
      group.tabs.some((tab) => tab.label.includes('BMAD Dash')),
    );
    if (!found) {
      throw new Error('BMAD Dash webview panel not found after executing bmad.showDash');
    }
  } catch (err) {
    throw new Error(`[SMOKE TEST FAILURE] ${String(err)}`);
  }
}
