import * as vscode from 'vscode';
import { activateBmadDash } from './provider';

export function activate(context: vscode.ExtensionContext): void {
  activateBmadDash(context);
}

export function deactivate(): void {
  // required VS Code extension lifecycle hook
}
