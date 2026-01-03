class ElementManager {
  constructor() {
    this.elements = [];
    this.observer = null;
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    const storedElements = await this.getStoredElements();
    this.elements = storedElements.map((el) => new YouTubeElement(el));
    this.initialized = true;
    return this.elements;
  }

  async getStoredElements() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        ["tubemod_elements", "tubemod_version"],
        (result) => {
          if (
            result.tubemod_elements &&
            result.tubemod_version === STORAGE.tubemod_version
          ) {
            resolve(JSON.parse(result.tubemod_elements));
          } else if (
            result.tubemod_elements &&
            result.tubemod_version !== STORAGE.tubemod_version
          ) {
            const storedElements = JSON.parse(result.tubemod_elements);
            const mergedElements = STORAGE.tubemod_elements.map(
              (newElement) => {
                const storedElement = storedElements.find(
                  (el) => el.id === newElement.id
                );
                if (storedElement) {
                  return { ...newElement, checked: storedElement.checked };
                }
                return newElement;
              }
            );
            chrome.storage.local.set({
              tubemod_elements: JSON.stringify(mergedElements),
              tubemod_version: STORAGE.tubemod_version,
            });
            resolve(mergedElements);
          } else {
            chrome.storage.local.set({
              tubemod_elements: JSON.stringify(STORAGE.tubemod_elements),
              tubemod_version: STORAGE.tubemod_version,
            });
            resolve(STORAGE.tubemod_elements);
          }
        }
      );
    });
  }

  async saveElements() {
    const serializedElements = JSON.stringify(this.elements);
    await chrome.storage.local.set({
      tubemod_elements: serializedElements,
      tubemod_version: STORAGE.tubemod_version,
    });
  }

  async handleAction(action) {
    const element = this.elements.find((el) => el.id === action.target);
    if (element) {
      await element.toggle(action.hide);
      await this.saveElements();
    }
  }

  setupObserver() {
    this.observer?.disconnect();
    this.observer = new MutationObserver(
      debounce(this.handleMutations.bind(this), 50)
    );
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  handleMutations() {
    this.applyAllElements(getCurrentPageType(), true);
  }

  async applyAllElements(pageType, skipRoundedBorders = false) {
    if (!this.initialized) {
      await this.initPromise;
    }

    const relevantElements = this.elements.filter(
      (el) => el.pageTypes.length === 0 || el.pageTypes.includes(pageType)
    );

    const elementsToProcess = skipRoundedBorders
      ? relevantElements.filter((el) => el.id !== "remove-rounded-borders")
      : relevantElements;

    const criticalElements = elementsToProcess.filter(
      (el) => el.checked && (el.styles?.display === 'none' || el.style === 'none' || el.property === 'display')
    );
    const otherElements = elementsToProcess.filter(
      (el) => !criticalElements.includes(el)
    );

    for (const element of criticalElements) {
      if (element.checked !== undefined) {
        element.toggle(element.checked);
      }
    }

    if (otherElements.length > 0) {
      requestAnimationFrame(() => {
        otherElements.forEach((element) => {
          if (element.checked !== undefined) {
            element.toggle(element.checked);
          }
        });
      });
    }
  }
}

