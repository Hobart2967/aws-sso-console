import { BrowserWindow, ipcMain, Session, BrowserWindowConstructorOptions, Cookie } from "electron";

export class BaseWindow {
  //#region Properties
  protected _browserWindow: BrowserWindow;
  public get browserWindow(): BrowserWindow {
    return this._browserWindow
  }

  protected _session: Session;
  public get session(): Session {
    return this._session;
  }
  //#endregion

  //#region Ctor
  public constructor(
    private readonly _baseUrl: string,
    private readonly _initialTitle?: string) {}
  //#endregion


  //#region Public Static Methods
  public static getCookieUrl(cookie: Cookie) {
    let { secure, domain } = cookie;
    domain = domain as string;

    const scheme = secure ? "https" : "http";
    const host = domain[0] === "." ? domain.substr(1) : domain;
    const url = scheme + "://" + host;
    return url;
  }
  //#endregion

  //#region Public Methods
  public async open(): Promise<void> {
    this._browserWindow = new BrowserWindow(await this.createBrowserWindowOptions());

    this._session = this._browserWindow.webContents.session;

    this._browserWindow.maximize();

    const ipcMainBindingAware = (this as Object).constructor as any;
    const bindings: string[] = (ipcMainBindingAware.ipcMainBindings || []);
    bindings
      .forEach((listenerName: string) =>
        ipcMain.on(listenerName, (...args: any[]) =>
        (this as any)[listenerName](...args.slice(1))))

    await this._browserWindow.loadURL(this._baseUrl);

    if (!this._initialTitle) {
      return;
    }

    this._browserWindow.on('page-title-updated', (evt) => {
      evt.preventDefault();
    });
  }

  public async executeScript<T>(script: string, listenerName: string): Promise<T|false> {
    return new Promise(async (resolve) => {
      const checkArgumentSent = (event: Event, arg: any) => {
        ipcMain.removeListener(listenerName, checkArgumentSent);

        arg = JSON.parse(arg);
        resolve(arg);
      };

      ipcMain.on(listenerName, checkArgumentSent);

      try {
        await this._browserWindow.webContents.executeJavaScript(script);
      } catch (e) {
        console.log(e);
        resolve(false);
      }
    });
  }

  /**
   * Execute a script in the renderer process repetitively.
   *
   * @param window The window to run the script in
   * @param script The script as string to run
   * @param listenerName The ipc listener name that the script calls
   * @param resultCheck A function that is checked each script run,
   * if it returns a truthy value, the loop will end and return that result
   *
   * @param delay The minimum delay between each loop runs
   * @returns Returns the value that the `resultCheck` function returns when returing a truthy value.
   */
  public async repeatScript<T>(
    script: string,
    listenerName: string,
    resultCheck: (result: any) => Promise<T|false>,
    delay: number): Promise<T> {

    while (true) {
      await new Promise<void>(resolveTimeout =>
        setTimeout(() => resolveTimeout(), delay));

      if (this._browserWindow.isDestroyed()) {
        return undefined;
      }

      const scriptResult = await this.executeScript(script, listenerName);
      const result = await resultCheck(scriptResult);
      if (result) {
        return result as T;
      }
    }
  }
  //#endregion

  //#region Private Methods
  protected async createBrowserWindowOptions(): Promise<BrowserWindowConstructorOptions> {
    return {
      width: 800,
      height: 600,
      tabbingIdentifier: 'awsSsoConsole',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      title: this._initialTitle
    };
  }
  //#endregion
}