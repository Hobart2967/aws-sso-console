import { BaseWindow } from "./base.window";
import * as path from 'path';
import * as url from 'url';
import { ipcMainTarget } from "../decorators/ipc-main-target";
import { IdentityProviderSession } from "../session/identity-provider-session";
import { AwsEnvironmentWindow } from "./aws-environment.window";

const isDevelopment = process.env.NODE_ENV !== 'production';

export class StartPageWindow extends BaseWindow {
  //#region Private Fields
  private readonly _identityProviderSession: IdentityProviderSession;
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
      this._identityProviderSession.cookies);
    await awsEnvironmentWindow.open();
  }
  //#endregion
}