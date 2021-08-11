import { BaseWindow } from "./base.window";
import * as path from 'path';
import * as url from 'url';
import { ipcMainTarget } from "../decorators/ipc-main-target";
import { IdentityProviderSession } from "../services/identity-provider-session";
import { AwsEnvironmentWindow } from "./aws-environment.window";
import { Cookie } from "electron";
import { AwsConsoleConfigService } from "../services/aws-console-config.service";
import { AWS_SETTINGS_COOKIE } from "../models/aws-settings-cookie";

const isDevelopment = process.env.NODE_ENV !== 'production';

export class StartPageWindow extends BaseWindow {
  //#region Private Fields
  private readonly _identityProviderSession: IdentityProviderSession;
  private readonly _awsConsoleConfiguration: AwsConsoleConfigService;
  //#endregion

  //#region Ctor
  public constructor() {
    const windowUrl = isDevelopment
      ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
      : url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      });

    super(windowUrl);

    this._identityProviderSession = new IdentityProviderSession();
    this._awsConsoleConfiguration = new AwsConsoleConfigService();
  }
  //#endregion

  //#region Public Methods
  public async open() {
    await super.open();
  }

  @ipcMainTarget()
  public async login(baseUrl: string) {
    const loginSucceeded = await this._identityProviderSession.login(baseUrl);
    if (!loginSucceeded) {
      return;
    }

    this.browserWindow.webContents.send('login-succeeded', true);
  }

  @ipcMainTarget()
  public async openAwsEnvironment(baseUrl: string): Promise<void> {
    const awsEnvironmentWindow = new AwsEnvironmentWindow(
      baseUrl,
      'AWS Console',
      this._identityProviderSession.cookies,
      this._awsConsoleConfiguration);
    await awsEnvironmentWindow.open();
  }

  @ipcMainTarget()
  public async loadFavoriteServices(favoriteServices: string[]): Promise<void> {
    console.log(`Applied favorites for next environment opened: ${favoriteServices.join(', ')}`);
    this._awsConsoleConfiguration.favoriteServices = favoriteServices;
  }

  @ipcMainTarget()
  public async chooseFavoriteServices(baseUrl: string): Promise<void> {
    const awsEnvironmentWindow = new AwsEnvironmentWindow(
      baseUrl,
      'AWS Console',
      this._identityProviderSession.cookies,
      this._awsConsoleConfiguration);
    await awsEnvironmentWindow.open();

    const cookies = await new Promise<Cookie[]>(resolve =>
      awsEnvironmentWindow.browserWindow.on('close', async () =>
        resolve(await awsEnvironmentWindow.browserWindow.webContents.session.cookies.get({}))));

    const favoritesCookie = cookies.find(x => x.name === AWS_SETTINGS_COOKIE);
    const favoritesJson = decodeURIComponent(favoritesCookie.value);
    const favoritesConfiguration = JSON.parse(favoritesJson);
    const favoritesList = favoritesConfiguration.sc;
    this.browserWindow.webContents.send('favorite-services-updated', favoritesList);
    this.loadFavoriteServices(favoritesList);
  }
  //#endregion
}