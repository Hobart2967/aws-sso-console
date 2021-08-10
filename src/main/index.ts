import { StartPageWindow } from "./window/start-page.window";
const { app } = require('electron');

class App {
  //#region Public Methods
  public static async runMain(): Promise<void> {
    await app.whenReady();

    const mainWindow = new StartPageWindow();
    await mainWindow.open();
  }
  //#endregion
}

App.runMain();

