document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const tabsList = document.getElementById("tabsList");
  const closedTabsList = document.createElement("ul");
  closedTabsList.id = "closedTabsList";
  document.body.appendChild(closedTabsList);

  let tabs = [];
  let recentlyClosedTabs = [];
  let currentIndex = 0;
  let activeTabId = null;
  let lastActiveTabId = null;
  let hasInitialLoadCompleted = false;

  const fetchTabs = async () => {
    const activeTab = await browser.tabs.query({ active: true, currentWindow: true });
    activeTabId = activeTab[0].id;

    const allTabs = await browser.tabs.query({});
    tabs = allTabs.filter(tab => tab.id !== activeTabId);

    // Sort sound-playing and regular tabs
    const soundPlayingTabs = tabs.filter(tab => tab.audible).sort((a, b) => b.lastAccessed - a.lastAccessed);
    const nonSoundPlayingTabs = tabs.filter(tab => !tab.audible).sort((a, b) => b.lastAccessed - a.lastAccessed);
    tabs = soundPlayingTabs.concat(nonSoundPlayingTabs);

    // Identify the last active tab
    const recentlyAccessedTabs = allTabs.filter(tab => tab.id !== activeTabId).sort((a, b) => b.lastAccessed - a.lastAccessed);
    if (recentlyAccessedTabs.length > 0) {
      lastActiveTabId = recentlyAccessedTabs[0].id;
    }

    displayTabs(tabs);

    const closedSessions = await browser.sessions.getRecentlyClosed({ maxResults: 5 });
    recentlyClosedTabs = closedSessions.filter(session => session.tab).map(session => session.tab);

    displayClosedTabs(recentlyClosedTabs);

    tabsList.scrollTop = 0;
    searchInput.focus();

    // Update selection after initial rendering
    updateCombinedSelection();
  };

  const displayTabs = (tabsToDisplay) => {
    tabsList.innerHTML = "";

    // Separate sound-playing and regular tabs
    const soundPlayingTabs = tabsToDisplay.filter(tab => tab.audible);
    const regularTabs = tabsToDisplay.filter(tab => !tab.audible);

    // Audio Tabs Section
    if (soundPlayingTabs.length > 0) {
      const audioHeading = document.createElement("li");
      audioHeading.innerHTML = "<strong>Audio Tabs:</strong>";
      audioHeading.classList.add("section-heading");
      tabsList.appendChild(audioHeading);

      soundPlayingTabs.forEach((tab) => {
        const tabElement = document.createElement("li");
        tabElement.classList.add("tab-item");
        tabElement.setAttribute("data-id", tab.id);

        const titleText = document.createTextNode(tab.title);

        const audioIcon = document.createElement("span");
        audioIcon.textContent = " 🔊";
        audioIcon.classList.add("audio-icon");
        tabElement.appendChild(audioIcon);

        tabElement.appendChild(titleText);
        tabElement.onclick = () => {
          browser.tabs.update(tab.id, { active: true });
          window.close();
        };

        tabsList.appendChild(tabElement);
      });
    }

    // Open Tabs Section
    if (regularTabs.length > 0) {
      const openTabsHeading = document.createElement("li");
      openTabsHeading.innerHTML = "<strong>Open Tabs:</strong>";
      openTabsHeading.classList.add("section-heading");
      tabsList.appendChild(openTabsHeading);

      regularTabs.forEach((tab) => {
        const tabElement = document.createElement("li");
        tabElement.classList.add("tab-item");
        tabElement.setAttribute("data-id", tab.id);

        const titleText = document.createTextNode(tab.title);
        tabElement.appendChild(titleText);

        tabElement.onclick = () => {
          browser.tabs.update(tab.id, { active: true });
          window.close();
        };

        tabsList.appendChild(tabElement);
      });
    }
  };

  const displayClosedTabs = (closedTabs) => {
    closedTabsList.innerHTML = ""; // Clear previous results

    if (closedTabs.length > 0) {
      const header = document.createElement("li");
      header.innerHTML = "<strong>Recently Closed Tabs:</strong>";
      header.classList.add("section-heading");
      closedTabsList.appendChild(header);

      closedTabs.forEach((tab) => {
        const tabElement = document.createElement("li");
        tabElement.textContent = tab.title;
        tabElement.classList.add("closed-tab-item");
        tabElement.onclick = () => {
          browser.sessions.restore(tab.sessionId);
          window.close();
        };
        closedTabsList.appendChild(tabElement);
      });
    }
  };

  const displayDuckDuckGoResults = (results) => {
    closedTabsList.innerHTML = ""; // Clear previous results

    if (results.length > 0) {
      const header = document.createElement("li");
      header.innerHTML = "<strong>DuckDuckGo Results:</strong>";
      header.classList.add("section-heading");
      closedTabsList.appendChild(header);

      results.forEach((result) => {
        if (result.Text && result.FirstURL) {
          const resultElement = document.createElement("li");
          resultElement.textContent = result.Text;
          resultElement.classList.add("online-result");
          resultElement.setAttribute("data-url", result.FirstURL);
          resultElement.onclick = () => {
            browser.tabs.create({ url: result.FirstURL });
            window.close();
          };
          closedTabsList.appendChild(resultElement);
        }
      });
    }
  };

  const updateCombinedSelection = () => {
    const allItems = [...document.querySelectorAll(".tab-item, .closed-tab-item, .history-item, .online-result")];
    currentIndex = allItems.findIndex(item => item.getAttribute("data-id") === String(lastActiveTabId));
    if (currentIndex === -1) currentIndex = 0;

    updateSelection(allItems);
  };

  const updateSelection = (allItems) => {
    allItems.forEach((item, index) => {
      if (index === currentIndex) {
        item.classList.add("selected");
        if (hasInitialLoadCompleted) {
          item.scrollIntoView({ block: "nearest" });
        }
      } else {
        item.classList.remove("selected");
      }
    });
    hasInitialLoadCompleted = true;
  };

  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.toLowerCase();

    const filteredTabs = tabs.filter(tab =>
      tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
    );
    const filteredClosedTabs = recentlyClosedTabs.filter(tab =>
      tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
    );

    displayTabs(filteredTabs);
    displayClosedTabs(filteredClosedTabs);

    if (filteredTabs.length === 0 && filteredClosedTabs.length === 0) {
      await searchHistory(query);
    } else {
      updateCombinedSelection();
    }
  });

  const displayHistoryResults = (historyItems) => {
    closedTabsList.innerHTML = "";
    if (historyItems.length > 0) {
      const header = document.createElement("li");
      header.innerHTML = "<strong>History Results:</strong>";
      closedTabsList.appendChild(header);

      historyItems.forEach((item) => {
        const historyElement = document.createElement("li");
        historyElement.textContent = item.title;
        historyElement.classList.add("history-item");
        historyElement.setAttribute("data-url", item.url);
        historyElement.onclick = () => {
          browser.tabs.create({ url: item.url });
          window.close();
        };
        closedTabsList.appendChild(historyElement);
      });
      updateCombinedSelection();
    }
  };

  const searchHistory = async (query) => {
    const daysToSearch = await browser.storage.local.get("daysToSearch").then(result => result.daysToSearch || 1);
    const startTime = Date.now() - daysToSearch * 24 * 60 * 60 * 1000;

    const historyItems = await browser.history.search({
      text: query,
      startTime: startTime,
      maxResults: 5,
    });

    if (historyItems.length === 0) {
      await searchDuckDuckGo(query);
    } else {
      displayHistoryResults(historyItems);
    }
  };

  const searchDuckDuckGo = async (query) => {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`);
      const data = await response.json();
      displayDuckDuckGoResults(data.RelatedTopics);
    } catch (error) {
      console.error("Error fetching DuckDuckGo results:", error);
    }
  };

  document.addEventListener("keydown", (event) => {
    const allItems = document.querySelectorAll(".tab-item, .closed-tab-item, .history-item, .online-result");

    if (event.key === "ArrowDown") {
      event.preventDefault();
      currentIndex = (currentIndex + 1) % allItems.length;
      updateSelection(allItems);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      currentIndex = (currentIndex - 1 + allItems.length) % allItems.length;
      updateSelection(allItems);
    }

    if (event.key === "Enter" && currentIndex >= 0) {
      event.preventDefault();
      const selectedItem = allItems[currentIndex];

      if (selectedItem.classList.contains("tab-item")) {
        const tabId = tabs[currentIndex].id;
        browser.tabs.update(tabId, { active: true });
      } else if (selectedItem.classList.contains("closed-tab-item")) {
        const tabSessionId = recentlyClosedTabs[currentIndex - tabs.length].sessionId;
        browser.sessions.restore(tabSessionId);
      } else if (selectedItem.classList.contains("history-item") || selectedItem.classList.contains("online-result")) {
        const url = selectedItem.getAttribute("data-url");
        browser.tabs.create({ url: url });
      }
      window.close();
    }
  });

  fetchTabs();
});
