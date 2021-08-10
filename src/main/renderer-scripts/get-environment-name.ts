const listener = 'update-title';

export const getEnvironmentName = {
  listener,
  script: `(() => {
    const element = document.querySelector('[data-testid="awsc-nav-account-menu-button"] > span:first-child');
    if (element) {
      require('electron').ipcRenderer.send('${listener}', JSON.stringify(element.title));
    } else {
      require('electron').ipcRenderer.send('${listener}', JSON.stringify(false));
    }
  })()`
}