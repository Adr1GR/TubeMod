function saveSettings() {
  const downloadLink = document.createElement("a");
  chrome.storage.local.get(
    ["tubemod_elements", "tubemod_version"],
    (result) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const file = new Blob([JSON.stringify(result)], {
        type: "application/json",
      });
      downloadLink.href = URL.createObjectURL(file);
      downloadLink.download = "tubeModSettings.json";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  );
}

function importSettings(settings) {
  chrome.storage.local.set({
    tubemod_elements: JSON.parse(settings)["tubemod_elements"],
    tubemod_version: JSON.parse(settings)["tubemod_version"],
  });
  location.reload();
  alert("TubeMod settings uploaded and applied!");
}

let cachedPageType = null;
let cachedUrl = null;

function getCurrentPageType() {
  const url = window.location.href;
  if (cachedUrl === url && cachedPageType !== null) {
    return cachedPageType;
  }

  let pageType = null;
  if (
    url === "https://www.youtube.com/" ||
    url.startsWith("https://www.youtube.com/?")
  ) {
    pageType = PAGE_TYPES.HOME;
  } else if (url.includes("/watch")) {
    pageType = PAGE_TYPES.VIDEO;
  } else if (url.includes("/feed/subscriptions")) {
    pageType = PAGE_TYPES.SUBSCRIPTIONS;
  } else if (url.includes("/results?search_query")) {
    pageType = PAGE_TYPES.SEARCH;
  } else if (url.includes("/feed/trending")) {
    pageType = PAGE_TYPES.TRENDING;
  } else if (url.includes("/feed/downloads")) {
    pageType = PAGE_TYPES.DOWNLOADS;
  } else if (url.includes("/@")) {
    pageType = PAGE_TYPES.CHANNEL;
  }

  cachedPageType = pageType;
  cachedUrl = url;
  return pageType;
}

function clearPageTypeCache() {
  cachedPageType = null;
  cachedUrl = null;
}

function waitForElements(selector, callback) {
  const observer = new MutationObserver((mutations, obs) => {
    const element = document.evaluate(
      selector,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    if (element) {
      obs.disconnect();
      callback([element]);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const existingElement = document.evaluate(
    selector,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
  if (existingElement) {
    callback([existingElement]);
    return;
  }
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

