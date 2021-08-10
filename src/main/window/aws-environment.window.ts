import { Cookie } from 'electron';
import { getEnvironmentName } from '../renderer-scripts/get-environment-name';
import { ScopedPrivateWindow } from './scoped-private.window';

export class AwsEnvironmentWindow extends ScopedPrivateWindow {
  //#region ctor
  public constructor(
    _baseUrl: string,
    _initialTitle: string,
    _cookies: Cookie[]) {
      super(_baseUrl, _initialTitle);
  }
  //#endregion
  //#region Public Methods
  public async open() {
    await super.open();

    this._browserWindow.webContents.on('new-window', (event, url) =>
      this.handleNewWindow(event, url));
  }
  //#endregion

  //#region Private Methods
  private async handleNewWindow(event: Event, url: string) {
    this.cancelOpening(event);
    await this.loadUrlInSameWindow(url);
    await this.applyWindowTitle();
  }

  private async loadUrlInSameWindow(url: string) {
    await this._browserWindow.loadURL(url);
  }

  private async applyWindowTitle() {
    const environmentName = await this.getAwsEnvironmentName();
    this._browserWindow.setTitle(`${environmentName} - AWS Console`);
  }

  private cancelOpening(event: Event) {
    event.preventDefault();
  }

  private async getAwsEnvironmentName(): Promise<string> {
    const { script, listener } = getEnvironmentName;
    return this.repeatScript(
      script,
      listener,
      async (arg: string|false) => this.checkIfEnvironmentNameIsValid(arg),
      500);
  }

  public async checkIfEnvironmentNameIsValid(arg: string | boolean): Promise<string|false> {
    if (arg === false) {
      return false;
    }

    const titleRegex = /@ (.*)$/;
    const matches = titleRegex.exec(arg as string);
    if (!matches || !matches[1]) {
      return false;
    }

    const [_, environmentName]: string[] = matches;
    return environmentName;
  }
  //#endregion
}