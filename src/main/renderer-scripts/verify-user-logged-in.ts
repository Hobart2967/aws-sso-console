const listener = 'login-succeeded';

export const verifyLoggedInScript = {
  listener,
  script: `(() => {
    const element = document.querySelector('title');
    if (element) {
      require('electron').ipcRenderer.send('${listener}', JSON.stringify(element.innerText === 'Your applications'));
    } else {
      require('electron').ipcRenderer.send('${listener}', JSON.stringify(false));
    }
  })()`
}