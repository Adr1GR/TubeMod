const inputs = document.querySelectorAll("input");
const collapsibleElements = document.getElementsByClassName("collapsible");

function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].url || !tabs[0].url.includes("youtube.com")) {
      if (callback) callback(new Error("Not a YouTube tab"));
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Content script not ready:", chrome.runtime.lastError.message);
        if (callback) callback(chrome.runtime.lastError);
        return;
      }
      if (callback) callback(null, response);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["tubemod_elements"], (result) => {
    const elements = result.tubemod_elements
      ? JSON.parse(result.tubemod_elements)
      : null;

    if (elements !== null) {
      elements.forEach((element) => {
        const checkbox = document.getElementById(element.id);
        if (checkbox) {
          checkbox.checked = element.checked;
        }
      });
    }

    for (let i = 0; i < collapsibleElements.length; i++) {
      collapsibleElements[i].addEventListener("click", function () {
        this.classList.toggle("active");
        const content = this.nextElementSibling;
        if (content.style.display === "block") {
          content.style.display = "none";
        } else {
          content.style.display = "block";
        }
      });
    }

    inputs.forEach((element) => {
      element.addEventListener("change", () => {
        sendMessageToContentScript({
          action: {
            target: element.id,
            hide: element.checked,
          },
        });
      });
    });
  });
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message.type === "popup") {
    chrome.storage.local.set({ elements: JSON.stringify(message.data) });
  }
});

document.getElementById("reset-settings").addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    console.info("Settings cleared.");
  });
  sendMessageToContentScript({
    action: "clearLocalStorage",
  });
  window.close();
});

document.getElementById("save-settings").addEventListener("click", () => {
  sendMessageToContentScript({
    action: "saveSettings",
  });
});

document
  .getElementById("import-settings")
  .addEventListener("change", async (e) => {
    const file = e.target.files.item(0);
    if (!file) return;

    const text = await file.text();
    sendMessageToContentScript({
      action: "importSettings",
      content: text,
    });
  });

