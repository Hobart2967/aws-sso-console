const { ipcRenderer } = require('electron');

(() => {
  function openEnvironment(baseUrl) {
    ipcRenderer.send('openAwsEnvironment', baseUrl)
  }

  function login(baseUrl) {
    ipcRenderer.send('login', baseUrl)
  }

  function main() {
    const baseUrl = document.getElementById('awsSsoBaseUrl');
    baseUrl.value = localStorage.getItem('awsSsoBaseUrl');
    baseUrl.addEventListener('change', () => {
      localStorage.setItem('awsSsoBaseUrl', baseUrl.value);
    });

    const openEnvironmentButton = document.getElementById('openEnvironment');
    openEnvironmentButton.addEventListener('click', () => {
      if(openEnvironmentButton.classList.contains('disabled')) {
        return;
      }
      openEnvironment(baseUrl.value)
    });

    const loginButton = document.getElementById('login');
    loginButton.addEventListener('click', () => login(baseUrl.value));

    ipcRenderer.on('login-succeeded', () => {
      openEnvironmentButton.classList.remove('disabled');
      loginButton.classList.remove('btn-primary');
      const alert = document.getElementById('login-alert');
      alert.remove();
    });

  }

  main();
})();