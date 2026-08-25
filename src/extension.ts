import * as vscode from 'vscode';
import { activateBmadDash } from './provider';

export function activate(context: vscode.ExtensionContext): void {
  activateBmadDash(context);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function -- required VS Code extension lifecycle hook
export function deactivate(): void {}
