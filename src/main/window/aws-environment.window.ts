import { BrowserViewConstructorOptions, Cookie } from 'electron';
import { AWS_SETTINGS_COOKIE } from '../models/aws-settings-cookie';
import { getEnvironmentName } from '../renderer-scripts/get-environment-name';
import { AwsConsoleConfigService } from '../services/aws-console-config.service';
import { BaseWindow } from './base.window';
import { ScopedPrivateWindow } from './scoped-private.window';

export class AwsEnvironmentWindow extends ScopedPrivateWindow {
  //#region Public Statics
  public static readonly ONE_YEAR = 31536000;
  //#endregion

  //#region ctor
  public constructor(
    _baseUrl: string,
    _initialTitle: string,
    _cookies: Cookie[],
    private readonly _config: AwsConsoleConfigService) {
      super(_baseUrl, _initialTitle, _cookies);
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
  protected async createBrowserWindowOptions(): Promise<BrowserViewConstructorOptions> {
    const options = await super.createBrowserWindowOptions();
    await this.rewriteConsoleSettings(options);
    return options;
  }

  private async rewriteConsoleSettings(options: BrowserViewConstructorOptions) {
    const cookies = await options.webPreferences.session.cookies.get({ });
    const settingsCookie = cookies.find(cookie => cookie.name === AWS_SETTINGS_COOKIE) || {
      name: AWS_SETTINGS_COOKIE,
      domain: ".console.aws.amazon.com",
      hostOnly: false,
      path: "/",
      secure: true,
      httpOnly: false,
      session: false,
      value: '{}',
      expirationDate: parseInt(new Date().getTime() / 1000 as any) + AwsEnvironmentWindow.ONE_YEAR,
      sameSite: "unspecified",
    } as Cookie;

    const settings = settingsCookie
      ? JSON.parse(decodeURIComponent(settingsCookie.value))
      : { sc: null };

    await options.webPreferences.session.cookies.set({
      ...settingsCookie,
      value: encodeURIComponent(JSON.stringify({
        ...settings,
        sc: this._config.favoriteServices
      })),
      url: BaseWindow.getCookieUrl(settingsCookie)
    });
  }

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