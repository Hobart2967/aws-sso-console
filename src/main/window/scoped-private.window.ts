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
  protected createBrowserWindowOptions(): BrowserViewConstructorOptions {
    const privateSession = session.fromPartition(`${new Date().getTime()}`);
    for (const cookie of this._cookies) {
      const url = this.getCookieUrl(cookie);
      privateSession.cookies.set({ ...cookie, url });
    }

    const privateWindowOptions = super.createBrowserWindowOptions();
    privateWindowOptions.webPreferences.session = privateSession;

    return privateWindowOptions;
  }

  private getCookieUrl(cookie: Cookie) {
    let { secure, domain } = cookie;
    domain = domain as string;

    const scheme = secure ? "https" : "http";
    const host = domain[0] === "." ? domain.substr(1) : domain;
    const url = scheme + "://" + host;
    return url;
  }
  //#endregion
}