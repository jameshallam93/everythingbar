// options.js

document.addEventListener("DOMContentLoaded", () => {
    const daysToSearchInput = document.getElementById("daysToSearch");
    console.log("Days to Search:", daysToSearch);
    const saveButton = document.getElementById("saveButton");
  
    // Load the saved setting and display it
    browser.storage.sync.get("daysToSearch").then((result) => {
      daysToSearchInput.value = result.daysToSearch || 1; // Default to 7 days if not set
    });
  
    // Save the user's setting
    saveButton.addEventListener("click", () => {
      const daysToSearch = parseInt(daysToSearchInput.value);
      browser.storage.sync.set({ daysToSearch });
      alert("Settings saved!");
    });
  });
  