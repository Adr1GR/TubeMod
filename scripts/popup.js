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

function filterSettings(searchTerm) {
  const searchLower = searchTerm.toLowerCase().trim();
  const containers = document.querySelectorAll(".container");
  const collapsibleButtons = document.querySelectorAll(".collapsible");

  if (searchTerm === "") {
    containers.forEach((container) => {
      container.style.display = "none";
      const hrElements = container.querySelectorAll("hr");
      hrElements.forEach((hr) => {
        hr.style.display = "block";
      });
      const checkboxContainers = container.querySelectorAll(".checkbox-container");
      checkboxContainers.forEach((checkboxContainer) => {
        checkboxContainer.style.display = "flex";
      });
    });
    collapsibleButtons.forEach((button) => {
      button.classList.remove("active");
      button.style.display = "block";
    });
    return;
  }

  containers.forEach((container, index) => {
    const checkboxContainers = container.querySelectorAll(".checkbox-container");
    const hrElements = container.querySelectorAll("hr");
    let hasMatch = false;

    checkboxContainers.forEach((checkboxContainer) => {
      const label = checkboxContainer.querySelector("label[for]");
      if (label) {
        const labelText = label.textContent.toLowerCase().trim().replace(/\s+/g, " ");
        if (labelText.includes(searchLower)) {
          checkboxContainer.style.display = "flex";
          hasMatch = true;
        } else {
          checkboxContainer.style.display = "none";
        }
      }
    });

    if (hasMatch) {
      const children = Array.from(container.children);
      const checkboxContainersArray = Array.from(checkboxContainers);
      children.forEach((child, childIndex) => {
        if (child.tagName === "HR") {
          const prevVisible = getPreviousVisibleElement(children, childIndex, checkboxContainersArray);
          const nextVisible = getNextVisibleElement(children, childIndex, checkboxContainersArray);
          
          if (!prevVisible || !nextVisible) {
            child.style.display = "none";
          } else {
            child.style.display = "block";
          }
        }
      });
    } else {
      hrElements.forEach((hr) => {
        hr.style.display = "none";
      });
    }

    const collapsibleButton = collapsibleButtons[index];
    if (hasMatch) {
      container.style.display = "block";
      collapsibleButton.classList.add("active");
      collapsibleButton.style.display = "block";
    } else {
      container.style.display = "none";
      collapsibleButton.classList.remove("active");
      collapsibleButton.style.display = "none";
    }
  });
}

function getPreviousVisibleElement(children, currentIndex, checkboxContainers) {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const element = children[i];
    if (checkboxContainers.includes(element)) {
      return element.style.display !== "none";
    }
  }
  return false;
}

function getNextVisibleElement(children, currentIndex, checkboxContainers) {
  for (let i = currentIndex + 1; i < children.length; i++) {
    const element = children[i];
    if (checkboxContainers.includes(element)) {
      return element.style.display !== "none";
    }
  }
  return false;
}

function initializeSearch() {
  const searchInput = document.getElementById("settings-search");
  const clearButton = document.getElementById("clear-search");

  if (!searchInput || !clearButton) return;

  function updateClearButton() {
    if (searchInput.value.trim() !== "") {
      clearButton.style.display = "flex";
    } else {
      clearButton.style.display = "none";
    }
  }

  searchInput.addEventListener("input", (e) => {
    updateClearButton();
    filterSettings(e.target.value);
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    updateClearButton();
    filterSettings("");
    searchInput.focus();
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
      const searchInput = document.getElementById("settings-search");
      const hasActiveSearch = searchInput && searchInput.value.trim() !== "";
      
      if (hasActiveSearch) {
        return;
      }
      
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });
  }

  const inputs = document.querySelectorAll("input[type='checkbox']");
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

  initializeSearch();

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


