import { BrowserViewConstructorOptions, Cookie, session } from "electron";
import { BaseWindow } from "./base.window";

export class ScopedPrivateWindow extends BaseWindow {
  //#region Ctor
  public constructor(
    _baseUrl: string,
    _initialTitle?: string,
    protected readonly _cookies: Cookie[] = []) {
      super(_baseUrl, _initialTitle);
  }
  //#endregion

  //#region Private Methods
  protected async createBrowserWindowOptions(): Promise<BrowserViewConstructorOptions> {
    const privateSession = session.fromPartition(`${new Date().getTime()}`);
    for (const cookie of this._cookies) {
      const url = BaseWindow.getCookieUrl(cookie);
      privateSession.cookies.set({ ...cookie, url });
    }

    const privateWindowOptions = await super.createBrowserWindowOptions();
    privateWindowOptions.webPreferences.session = privateSession;

    return privateWindowOptions;
  }
  //#endregion
}