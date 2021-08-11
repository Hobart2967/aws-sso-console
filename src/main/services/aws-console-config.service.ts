export class AwsConsoleConfigService {
  //#region Properties
  private _favoriteServices: string[];
  public get favoriteServices(): string[] {
    return this._favoriteServices;
  }
  public set favoriteServices(v: string[]) {
    this._favoriteServices = v;
  }
  //#endregion
}

