import * as vscode from "vscode";

// Adjusted from https://github.com/microsoft/vscode-extension-samples/tree/main/webview-sample
export class StatemachineVisualization {
  public static currentPanel: StatemachineVisualization | undefined;

  public static readonly title = "LF Statemachine Preview";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createWebview(extensionContext: vscode.ExtensionContext): void {
    const panel = vscode.window.createWebviewPanel(
      "statemachinePreview",
      StatemachineVisualization.title,
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionContext.extensionUri, "out"),
          vscode.Uri.joinPath(extensionContext.extensionUri, "images"),
        ],
      }
    );

    StatemachineVisualization.currentPanel = new StatemachineVisualization(
      panel,
      extensionContext
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri
  ): void {
    StatemachineVisualization.currentPanel = new StatemachineVisualization(
      panel,
      extensionUri
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionContext: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionContext.extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateStatemachineVisualization(mermaidDiagramCode: string) {
    this._panel.webview.postMessage({
      command: "update",
      content: mermaidDiagramCode,
    });
  }

  public dispose() {
    StatemachineVisualization.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = await this._getWebviewContent(webview);
  }

  private async _getWebviewContent(webview: vscode.Webview) {
    const mermaidVisualizationUri = vscode.Uri.joinPath(
      this._extensionUri,
      "out"
    );
    const webviewPath = vscode.Uri.joinPath(
      this._extensionUri,
      "out",
      "mermaidVisualization.html"
    );
    const webviewContent = await vscode.workspace.fs.readFile(webviewPath);
    const mermaidVisualizationScriptUri = webview.asWebviewUri(
      mermaidVisualizationUri
    );
    const htmlContent = webviewContent
      .toString()
      .replace(
        /__MERMAID_SCRIPT_URI__/g,
        mermaidVisualizationScriptUri.toString()
      );

    return htmlContent;
  }
}
