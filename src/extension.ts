import * as vscode from "vscode";
import * as util from "util";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";
import { RideConfiguration } from "./configuration";
import { StateMachineVisualization } from "./stateMachineVisualization";

const execFile = util.promisify(require("child_process").execFile);

let languageClient: LanguageClient;

interface MermaidDiagramNotification {
  uri: string;
  diagram: string;
}

export async function activate(context: vscode.ExtensionContext) {
  const configuration = new RideConfiguration(
    vscode.workspace.getConfiguration()
  );

  const { rideSupportsLsp, rideSupportsVisualization } =
    await checkRideFeatures(configuration);

  if (!rideSupportsLsp) {
    vscode.window.showWarningMessage(
      "Ride does not support lsp. Please upgrade."
    );
    return;
  }

  const languageClient = initializeLanguageClient(configuration);
  await languageClient.start();
  context.subscriptions.push(languageClient);
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory(
      "lf",
      new DebugAdapterExecutableFactory(configuration)
    )
  );

  if (!rideSupportsVisualization) {
    vscode.window.showWarningMessage(
      "Ride does not support lf state machine visualization. Please upgrade."
    );
    return;
  }

  const diagramStore: { [uri: string]: string } = {};
  setUpVisualizationSupport(context, languageClient, diagramStore);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.openStateMachineVisualization",
      () => {
        StateMachineVisualization.createWebview(context);
      }
    )
  );

  StateMachineVisualization.createWebview(context);
}

export async function deactivate() {
  if (languageClient) {
    await languageClient.stop();
  }
}

async function checkRideFeatures(configuration: RideConfiguration) {
  let rideSupportsLsp = false;
  let rideSupportsVisualization = false;

  try {
    const versionResult = await execFile(
      configuration.ridePath,
      ["--version"],
      {}
    );

    const semverSatisfies = require("semver/functions/satisfies");
    rideSupportsLsp = semverSatisfies(versionResult.stdout, ">=0.9.0");
    rideSupportsVisualization = semverSatisfies(
      versionResult.stdout,
      ">=1.0.0"
    );
  } catch (e) {
    vscode.window.showWarningMessage("Ride executable not found!");
  }

  return { rideSupportsLsp, rideSupportsVisualization };
}

function initializeLanguageClient(configuration) {
  const serverOptions: ServerOptions = {
    command: configuration.ridePath,
    args: ["language-server"],
    options: {
      shell: true,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { language: "lf", scheme: "file" },
      { language: "lf", scheme: "untitled" },
    ],
  };

  return new LanguageClient(
    "rideLanguageClient",
    "RIDE Language Server",
    serverOptions,
    clientOptions
  );
}

function setUpVisualizationSupport(context, languageClient, diagramStore) {
  languageClient.onNotification(
    "lfls/mermaidVisualization",
    (notification: MermaidDiagramNotification) => {
      const { uri, diagram } = notification;
      diagramStore[uri] = diagram;
      StateMachineVisualization.currentPanel?.updateStateMachineVisualization(
        diagram
      );
    }
  );

  let disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) return;
    const { fileName, languageId } = editor.document;

    if (fileName.endsWith(".lf") || languageId === "lf") {
      const diagram = diagramStore[`file://${editor.document.fileName}`];
      if (diagram) {
        StateMachineVisualization.currentPanel?.updateStateMachineVisualization(
          diagram
        );
      }
    }
  });
  context.subscriptions.push(disposable);
}

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private readonly rideConfig: RideConfiguration;

  constructor(rideConfig: RideConfiguration) {
    this.rideConfig = rideConfig;
  }

  createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    _executable: vscode.DebugAdapterExecutable | undefined
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    return new vscode.DebugAdapterExecutable(this.rideConfig.ridePath, [
      "execution",
      "debug",
      session.configuration["stateMachine"],
      "-i",
    ]);
  }
}
