class TubeMod {
  constructor() {
    this.elementManager = new ElementManager();
    this.setupEventListeners();
  }

  setupEventListeners() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    window.addEventListener(
      "DOMContentLoaded",
      this.handleYouTubeNavigate.bind(this)
    );
    window.addEventListener("popstate", this.handleYouTubeNavigate.bind(this));
    window.addEventListener("load", this.handleLoad.bind(this));
  }

  handleMessage(request) {
    if (request.action === "clearLocalStorage") {
      this.clearLocalStorage();
    } else if (request.action === "saveSettings") {
      saveSettings();
    } else if (request.action === "importSettings") {
      importSettings(request.content);
    } else {
      this.elementManager.handleAction(request.action);
    }
  }

  clearLocalStorage() {
    chrome.storage.local.clear(() => {
      chrome.storage.local.set(
        { elements: JSON.stringify(STORAGE.tubemod_elements) },
        () => {
          console.info("Default settings restored.");
          location.reload();
        }
      );
    });
  }

  async handleLoad() {
    await this.elementManager.initPromise;
    this.elementManager.applyAllElements(getCurrentPageType());
    this.elementManager.setupObserver();
  }

  handleYouTubeNavigate() {
    clearPageTypeCache();
    this.elementManager.initPromise.then(() => {
      this.elementManager.applyAllElements(getCurrentPageType());
    });
  }
}

const tubeMod = new TubeMod();

