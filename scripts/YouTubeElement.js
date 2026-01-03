class YouTubeElement {
  constructor(config) {
    Object.assign(this, config);
  }

  async toggle(hide) {
    this.checked = hide;
    return Promise.resolve(this.handleVisibility(hide));
  }

  handleVisibility(hide) {
    const currentPageType = getCurrentPageType();
    if (
      this.pageTypes.length > 0 &&
      !this.pageTypes.includes(currentPageType)
    ) {
      return;
    }
    this.applyVisibility(hide);
  }

  applyVisibility(hide) {
    if (this.id === "remove-rounded-borders") {
      const applyStyle = () => {
        if (!document.head) {
          setTimeout(applyStyle, 10);
          return;
        }

        let styleElement = document.getElementById("tubemod-remove-rounded-borders");
        const styleExists = styleElement !== null;
        
        if (hide && !styleExists) {
          styleElement = document.createElement("style");
          styleElement.id = "tubemod-remove-rounded-borders";
          styleElement.textContent = "* { border-radius: 0 !important; }";
          document.head.appendChild(styleElement);
        } else if (!hide && styleExists) {
          styleElement.remove();
        }
      };
      
      applyStyle();
      return;
    }

    const elements = document.evaluate(
      this.selector,
      document,
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const snapshotLength = elements.snapshotLength;
    if (snapshotLength === 0) return;

    for (let i = 0; i < snapshotLength; i++) {
      const element = elements.snapshotItem(i);
      if (!element) continue;

      if (this.styles && typeof this.styles === 'object') {
        if (hide) {
          Object.assign(element.style, this.styles);
        } else {
          Object.keys(this.styles).forEach(prop => {
            element.style[prop] = "";
          });
        }
      } else if (this.property && this.style !== undefined) {
        element.style[this.property] = hide ? this.style : "";
      }
    }

    if (this.id === "channel-trailer" && this.checked) {
      document.querySelector("video").pause();
    }

    if (this.id === "home-posts") {
      const postsElement = document.querySelector(
        "ytd-rich-section-renderer:has(ytd-post-renderer)"
      );
      if (postsElement) {
        hide ? (postsElement.disabled = true) : (postsElement.disabled = false);
      }
    }

    if (this.id === "video-views") {
      const viewsElement = document.getElementById("view-count");
      if (viewsElement) {
        hide ? (viewsElement.disabled = true) : (viewsElement.disabled = false);
      }
    }

    if (this.id === "video-shorts-description") {
      const descriptionShorts = document.querySelector(
        "ytd-structured-description-content-renderer > div#items > ytd-reel-shelf-renderer"
      );
      if (descriptionShorts) {
        hide
          ? (descriptionShorts.disabled = true)
          : (descriptionShorts.disabled = false);
      }
    }

    if (this.id === "tabs") {
      const frostedBar = document.getElementById("frosted-glass");
      if (frostedBar) {
        frostedBar.style.height = hide
          ? frostedBar.style.setProperty("height", "56px")
          : frostedBar.style.setProperty("height", "112px");
      }
    }

/*     if (this.id === "you") {
      const elementWithTopBorder = document.querySelector(
        "ytd-guide-collapsible-section-entry-renderer"
      );
      if (elementWithTopBorder) {
        elementWithTopBorder.style.borderTop = hide
          ? "none"
          : "1px solid var(--yt-spec-10-percent-layer)";
      }
    } */

/*     if (this.id === "my-clips") {
      const elementWithBottomBorder = document.querySelector(
        "ytd-guide-section-renderer"
      );
      if (elementWithBottomBorder) {
        elementWithBottomBorder.style.borderBottom = hide
          ? "none"
          : "1px solid var(--yt-spec-10-percent-layer)";
      }
    } */

    if (this.id === "video-thumbnail") {
      const thumbnailElement = document.getElementById(
        "video-thumbnail-tubemod"
      );

      if (hide && thumbnailElement === null) {
        const items = document.querySelector(
          "ytd-watch-next-secondary-results-renderer div#items"
        );

        let currentVideo = new URL(document.URL);
        let videoId = currentVideo.searchParams.get("v");
        let thumbnailSource = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        if (items) {
          let ytImage = document.createElement("ytd-thumbnail");

          let anchorTag = document.createElement("a");
          anchorTag.setAttribute("target", "_blank");
          anchorTag.setAttribute(
            "href",
            "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg"
          );

          let image = document.createElement("img");
          image.setAttribute("id", "video-thumbnail-tubemod");
          image.setAttribute("src", thumbnailSource);
          image.setAttribute(
            "class",
            "yt-core-image--fill-parent-width yt-core-image--loaded"
          );
          image.setAttribute(
            "style",
            "border-radius: 8px; margin-bottom: 8px;"
          );

          anchorTag.append(image);
          ytImage.append(anchorTag);
          items.prepend(ytImage);
        }
      } else if (!hide && thumbnailElement) {
        thumbnailElement.remove();
      }
    }

    if (this.id === "sidebar") {
      const videoContainer = document.querySelector(
        "ytd-app[guide-persistent-and-visible] ytd-page-manager.ytd-app"
      );

      if (videoContainer) {
        videoContainer.style.marginLeft = hide ? 0 : null;
      }
    }

    if (this.id === "studio-button") {
      const youtubeStudioButton = document.getElementById(
        "studio-button-tubemod"
      );

      if (hide && youtubeStudioButton === null) {
        const youtubeStudioButtonAnchor = document.createElement("a");
        youtubeStudioButtonAnchor.setAttribute(
          "href",
          "https://studio.youtube.com/"
        );
        youtubeStudioButtonAnchor.setAttribute("id", "studio-button-tubemod");
        youtubeStudioButtonAnchor.setAttribute("style", "margin-right: 8px;");

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute(
          "fill",
          window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "#fff"
            : "#000"
        );
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute(
          "style",
          "pointer-events: none; display: inherit; width: 100%; height: 100%;"
        );

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute(
          "d",
          "M10 9.35 15 12l-5 2.65ZM12 3a.73.73 0 00-.31.06L4.3 7.28a.79.79 0 00-.3.52v8.4a.79.79 0 00.3.52l7.39 4.22a.83.83 0 00.62 0l7.39-4.22a.79.79 0 00.3-.52V7.8a.79.79 0 00-.3-.52l-7.39-4.22A.73.73 0 0012 3m0-1a1.6 1.6 0 01.8.19l7.4 4.22A1.77 1.77 0 0121 7.8v8.4a1.77 1.77 0 01-.8 1.39l-7.4 4.22a1.78 1.78 0 01-1.6 0l-7.4-4.22A1.77 1.77 0 013 16.2V7.8a1.77 1.77 0 01.8-1.39l7.4-4.22A1.6 1.6 0 0112 2Zm0 4a.42.42 0 00-.17 0l-4.7 2.8a.59.59 0 00-.13.39v5.61a.65.65 0 00.13.37l4.7 2.8A.42.42 0 0012 18a.34.34 0 00.17 0l4.7-2.81a.56.56 0 00.13-.39V9.19a.62.62 0 00-.13-.37L12.17 6A.34.34 0 0012 6m0-1a1.44 1.44 0 01.69.17L17.39 8A1.46 1.46 0 0118 9.19v5.61a1.46 1.46 0 01-.61 1.2l-4.7 2.81A1.44 1.44 0 0112 19a1.4 1.4 0 01-.68-.17L6.62 16A1.47 1.47 0 016 14.8V9.19A1.47 1.47 0 016.62 8l4.7-2.8A1.4 1.4 0 0112 5Z"
        );

        svg.appendChild(path);

        const div = document.createElement("div");
        div.setAttribute(
          "style",
          "width: 24px; height: 24px; display: block; fill: currentcolor;"
        );

        div.appendChild(svg);

        const span = document.createElement("span");
        span.setAttribute(
          "class",
          "yt-icon-shape style-scope yt-icon yt-spec-icon-shape"
        );
        span.appendChild(div);

        const button = document.createElement("button");
        button.setAttribute(
          "style",
          "display: inline-block; vertical-align: middle; justify-items: center; color: inherit; outline: none; background: none; margin: 0; border: none; padding: 0; width: 100%; height: 100%; line-height: 0; cursor: pointer;"
        );
        button.append(span);

        const ytIconButton = document.createElement("div");
        ytIconButton.setAttribute("style", "height: 40px; width: 40px;");
        ytIconButton.append(button);

        youtubeStudioButtonAnchor.appendChild(ytIconButton);

        const headerButtons = document.querySelector(
          "ytd-masthead div#buttons"
        );
        const headerButtonsChildren = Array.from(headerButtons.children);
        const position = 1;

        headerButtons.insertBefore(
          youtubeStudioButtonAnchor,
          headerButtonsChildren[position]
        );
      } else if (!hide && youtubeStudioButton) {
        youtubeStudioButton.remove();
      }
    }
  }
}

