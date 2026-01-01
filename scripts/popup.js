function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].url || !tabs[0].url.includes("youtube.com")) {
      if (callback) callback(new Error("Not a YouTube tab"));
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message;
        if (errorMessage.includes("message port closed") || 
            errorMessage.includes("Receiving end does not exist")) {
          if (callback) callback(chrome.runtime.lastError);
          return;
        }
        console.warn("Content script error:", errorMessage);
        if (callback) callback(chrome.runtime.lastError);
        return;
      }
      if (callback) callback(null, response);
    });
  });
}

function updateCheckboxesFromStorage() {
  chrome.storage.local.get(["tubemod_elements"], (result) => {
    if (!result.tubemod_elements) {
      return;
    }

    try {
      const elements = JSON.parse(result.tubemod_elements);
      
      if (Array.isArray(elements)) {
        elements.forEach((element) => {
          if (!element || !element.hasOwnProperty("checked")) {
            return;
          }
          
          const checkbox = document.querySelector(`input[type="checkbox"][id="${element.id}"]`);
          if (checkbox) {
            if (checkbox.checked !== element.checked) {
              checkbox.checked = element.checked;
            }
          }
        });
      }
    } catch (error) {
      console.error("Error parsing stored elements:", error);
    }
  });
}

function initializePopup() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.tubemod_elements) {
      updateCheckboxesFromStorage();
    }
  });

  const collapsibleElements = document.getElementsByClassName("collapsible");
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

  const inputs = document.querySelectorAll("input");
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        updateCheckboxesFromStorage();
      }, 100);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePopup);
} else {
  initializePopup();
}

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


