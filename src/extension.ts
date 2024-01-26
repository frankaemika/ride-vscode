import * as vscode from "vscode";
import * as util from "util";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";
import { RideConfiguration } from "./configuration";

const execFile = util.promisify(require("child_process").execFile);

let languageClient: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
  let configuration = new RideConfiguration(
    vscode.workspace.getConfiguration()
  );

  let rideSupportsLsp = false;
  try {
    const versionResult = await execFile(
      configuration.ridePath,
      ["--version"],
      {}
    );
    const version: string = versionResult.stdout;
    const versionParts = version.split(".").map((v) => parseInt(v));
    if (
      versionParts.length == 3 &&
      (versionParts[0] > 0 || (versionParts[0] == 0 && versionParts[1] > 8))
    ) {
      rideSupportsLsp = true;
    }
  } catch (e) {
    vscode.window.showWarningMessage("Ride executable not found!");
    return;
  }

  if (!rideSupportsLsp) {
    vscode.window.showWarningMessage(
      "Ride does not support lsp, consider upgrading to the latest ride version to get language server support for lf files."
    );
    return;
  }

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

  // Create the language client and start the client.
  languageClient = new LanguageClient(
    "rideLanguageClient",
    "RIDE Language Server",
    serverOptions,
    clientOptions
  );

  languageClient.start();

  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory(
      "lf",
      new DebugAdapterExecutableFactory(configuration)
    )
  );
}

export async function deactivate() {
  if (languageClient) {
    await languageClient.stop();
  }
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
