import { WorkspaceConfiguration } from 'vscode';

export class RideConfiguration {
  private readonly configuration: WorkspaceConfiguration;

  constructor(configuration: WorkspaceConfiguration) {
    this.configuration = configuration;
  }

  public get ridePath(): string {
    return this.configuration.get('ride.ridePath', 'ride');
  }
}