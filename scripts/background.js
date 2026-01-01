function setPopupForTab(tab) {
  if (!tab || !tab.url) {
    return;
  }
  
  const isYouTube = tab.url.includes("youtube.com");
  const popupPath = isYouTube ? "../public/popup.html" : "../public/error.html";
  chrome.action.setPopup({ popup: popupPath });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, setPopupForTab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    setPopupForTab(tab);
  }
});
