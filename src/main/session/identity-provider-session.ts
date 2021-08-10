import { BrowserWindow, Cookie } from 'electron';
import { verifyLoggedInScript } from '../renderer-scripts/verify-user-logged-in';
import { ScopedPrivateWindow } from '../window/scoped-private.window';

export class IdentityProviderSession {
  //#region Properties
  private readonly _cookies: Cookie[] = [];
  public get cookies(): Cookie[] {
    return this._cookies
  }
  //#endregion

  //#region Ctor
  public constructor(
    private readonly _idpChecks = [
      /\.login\.live\.com$/,
      /\.login\.microsoftonline\.com$/
    ]) {
  }
  //#endregion

  //#region Public Methods
  public async login(baseUrl: string) {
    this._cookies.splice(0, this._cookies.length);

    const loginWindow = new ScopedPrivateWindow(baseUrl, 'Login to AWS Console');
    await loginWindow.open();

    const { script, listener } = verifyLoggedInScript;
    await loginWindow.repeatScript<boolean>(
      script,
      listener,
      async (arg: boolean) => arg === true,
      500);

    return await this._extractCookies(loginWindow.browserWindow);
  }
  //#endregion

  //#region Private Methods
  async _extractCookies(window: BrowserWindow) {
    const cookies = await window.webContents.session.cookies.get({});
    const idpCookies =  cookies.filter(x => this._idpChecks.some(regex => regex.test(x.domain || '')));
    this._cookies.push(...idpCookies);
    if (idpCookies.length === 0) {
      return false;
    }

    window.close();

    return true;
  }
  //#endregion
}