document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const tabsList = document.getElementById("tabsList");
    const closedTabsList = document.createElement("ul");
    closedTabsList.id = "closedTabsList";
    document.body.appendChild(closedTabsList);
  
    searchInput.focus();
  
    let tabs = [];
    let recentlyClosedTabs = [];
    let currentIndex = 0;
    let activeTabId = null;
  
    // Fetch tabs and recently closed tabs, then display the first item as selected
    const fetchTabs = async () => {
      const activeTab = await browser.tabs.query({ active: true, currentWindow: true });
      activeTabId = activeTab[0].id;
  
      const allTabs = await browser.tabs.query({});
      tabs = allTabs.filter(tab => tab.id !== activeTabId);
  
      tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
      displayTabs(tabs);
  
      const closedSessions = await browser.sessions.getRecentlyClosed({ maxResults: 5 });
      recentlyClosedTabs = closedSessions.filter(session => session.tab).map(session => session.tab);
  
      displayClosedTabs(recentlyClosedTabs);
    };
  
    // Display open tabs
    const displayTabs = (tabsToDisplay) => {
      tabsList.innerHTML = "";
      tabsToDisplay.forEach((tab) => {
        const tabElement = document.createElement("li");
        tabElement.textContent = tab.title;
        tabElement.classList.add("tab-item");
        tabElement.onclick = () => {
          browser.tabs.update(tab.id, { active: true });
          window.close();
        };
        tabsList.appendChild(tabElement);
      });
    };
  
    // Display recently closed tabs
    const displayClosedTabs = (closedTabs) => {
      closedTabsList.innerHTML = "";
      if (closedTabs.length > 0) {
        const header = document.createElement("li");
        header.innerHTML = "<strong>Recently Closed Tabs:</strong>";
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
  
    // Display history results
    const displayHistoryResults = (historyItems) => {
      closedTabsList.innerHTML = ""; // Clear previous results
  
      if (historyItems.length > 0) {
        const header = document.createElement("li");
        header.innerHTML = "<strong>History Results:</strong>";
        closedTabsList.appendChild(header);
  
        historyItems.forEach((item) => {
          const historyElement = document.createElement("li");
          historyElement.textContent = item.title;
          historyElement.classList.add("history-item");
          historyElement.setAttribute("data-url", item.url); // Store URL for selection
          historyElement.onclick = () => {
            browser.tabs.create({ url: item.url });
            window.close();
          };
          closedTabsList.appendChild(historyElement);
        });
      }
  
      updateCombinedSelection();
    };
  
    // Display DuckDuckGo results
    const displayDuckDuckGoResults = (results) => {
      closedTabsList.innerHTML = ""; // Clear previous content
      const header = document.createElement("li");
      header.innerHTML = "<strong>DuckDuckGo Results:</strong>";
      closedTabsList.appendChild(header);
  
      results.forEach((result) => {
        if (result.Text && result.FirstURL) {
          const resultElement = document.createElement("li");
          resultElement.textContent = result.Text;
          resultElement.classList.add("online-result");
          resultElement.setAttribute("data-url", result.FirstURL); // Store URL for selection
          resultElement.onclick = () => {
            browser.tabs.create({ url: result.FirstURL });
            window.close();
          };
          closedTabsList.appendChild(resultElement);
        }
      });
  
      updateCombinedSelection();
    };
  
    // Consolidate all items and update selection
    const updateCombinedSelection = () => {
      currentIndex = 0; // Reset selection to the first item
      const allItems = [...document.querySelectorAll(".tab-item, .closed-tab-item, .history-item, .online-result")];
      updateSelection(allItems);
    };
  
    // Apply selection to items
    const updateSelection = (allItems) => {
      allItems.forEach((item, index) => {
        if (index === currentIndex) {
          item.classList.add("selected");
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.classList.remove("selected");
        }
      });
    };
  
    // Input event listener for searching
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
  
    // Search history if no tabs match
    const searchHistory = async (query) => {
      const daysToSearch = await browser.storage.local.get("daysToSearch").then(result => result.daysToSearch || 1);
      const startTime = Date.now() - daysToSearch * 24 * 60 * 60 * 1000;
  
      const historyItems = await browser.history.search({
        text: query,
        startTime: startTime,
        maxResults: 5,
      });
  
      if (historyItems.length === 0) {
        // No history results, search DuckDuckGo
        await searchDuckDuckGo(query);
      } else {
        displayHistoryResults(historyItems);
      }
    };
  
    // Function to search DuckDuckGo if no other results are found
    const searchDuckDuckGo = async (query) => {
      try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`);
        const data = await response.json();
        displayDuckDuckGoResults(data.RelatedTopics);
      } catch (error) {
        console.error("Error fetching DuckDuckGo results:", error);
      }
    };
  
    // Keydown listener for cycling through items
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
  