const { ipcRenderer } = require('electron');

(() => {
  function loadPersistedFavoritesList(updateFavoritesList) {
    let favoritesList = null;
    const favoritesRaw = localStorage.getItem('favorites');
    if (favoritesRaw) {
      try {
        favoritesList = JSON.parse(favoritesRaw);
      } catch { }
    }

    favoritesList = favoritesList || [];

    updateFavoritesList(favoritesList);
    loadFavoriteServices(favoritesList);
  }

  function openEnvironment(baseUrl) {
    ipcRenderer.send('openAwsEnvironment', baseUrl)
  }

  function applyPersistedCookies(cookies) {
    ipcRenderer.send('applyPersistedCookies', cookies)
  }

  function chooseFavoriteServices(baseUrl) {
    ipcRenderer.send('chooseFavoriteServices', baseUrl)
  }

  function loadFavoriteServices(services) {
    ipcRenderer.send('loadFavoriteServices', services);
  }

  function login(baseUrl) {
    ipcRenderer.send('login', baseUrl)
  }

  function translateAwsService(serviceShortcut) {
    const translations = {
      s3: 'S3',
      cw: 'CloudWatch',
      lam: 'Lambda',
      ecr: 'Elastic Container Registry',
      ddb: 'DynamoDb',
      ag: 'API Gateway',
      cfr: 'CloudFront',
      iam: 'IAM'
    };

    return translations[serviceShortcut] || serviceShortcut;
  }

  function updateFavoritesList(favoritesList) {
    const servicesListElement = document.getElementById('favorite-services');
    if (!favoritesList.length) {
      servicesListElement.innerText = '(none)';
      return
    }

    servicesListElement.innerText = favoritesList
      .map(translateAwsService)
      .join(', ');
    favoritesList = favoritesList || [];
  }

  function loadPersistedCookies() {
    const persistedCookies = localStorage.getItem('loginCookies');
    if (!persistedCookies) {
      return;
    }

    applyPersistedCookies(JSON.parse(persistedCookies));
  }

  function main() {
    loadPersistedFavoritesList(updateFavoritesList);
    loadPersistedCookies();

    const baseUrl = document.getElementById('awsSsoBaseUrl');
    baseUrl.value = localStorage.getItem('awsSsoBaseUrl');
    baseUrl.addEventListener('change', () => localStorage.setItem('awsSsoBaseUrl', baseUrl.value));

    const chooseFavoriteServicesButton = document.getElementById('chooseFavoriteServices');
    chooseFavoriteServicesButton.addEventListener('click', () => chooseFavoriteServices(baseUrl.value));

    const openEnvironmentButton = document.getElementById('openEnvironment');
    openEnvironmentButton.addEventListener('click', () => {
      if(openEnvironmentButton.classList.contains('disabled')) {
        return;
      }

      openEnvironment(baseUrl.value);
    });

    const loginButton = document.getElementById('login');
    loginButton.addEventListener('click', () => login(baseUrl.value));

    ipcRenderer.on('favorite-services-updated', (event, favoritesList) => {
      localStorage.setItem('favorites', JSON.stringify(favoritesList));

      updateFavoritesList(favoritesList);
    });

    ipcRenderer.on('login-succeeded', () => {
      openEnvironmentButton.classList.remove('disabled');
      chooseFavoriteServicesButton.classList.remove('disabled');
      loginButton.classList.remove('btn-primary');
      const alert = document.getElementById('login-alert');
      alert.remove();
    });


    ipcRenderer.on('saveCookies', (event, cookies) => {
      localStorage.setItem('loginCookies', JSON.stringify(cookies.map(x => ({ ...x }))));
    })
  }

  main();
})();

