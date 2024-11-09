# The everything bar

A one stop shop to searching for that one tab you know you had open at one point.

An improvement over the list all tabs button that Firefox provides:
- Show tabs and recently closed tabs by default, in chronological order based on when you last viewed them.
- Tabs are all searchable, and the search bar is highlighted by default.
- The last tab you were on is auto selected by default, allowing quick switching between tabs by just pressing enter.
- If no results are found in your current or recent tabs, searches the last 1 day (configurable) of your browsing history.
- If no results can still be found, offers search options on duckduckgo to take you straight back to where you want to be.

This extension was born out of a frustration with Firefox's List all tabs button - this was a feature in Chrome that I had become
fully reliant on as a chronic 30+ tab opener, and the ease of use and extra functionality Chrome's version offered prevented me from switching over
to Firefox for professional use. However, I greatly prefer Firefox over Chrome from an idealogical perspective, and so with the upcoming Chrome
manifest changes, I was annoyed enough to make this extension.

To test all the features:
- Press Cmd+Shift+E (mac) or Cntrl+Shift+E (windows) and ensure a list of all tabs and recently closed tabs appears
- Search for a site which is not in your tabs/recent tabs, but will be in your history - ensure it appears as expected
- Search for a site that will not be in your history, ensure that the duckduckgo results are displayed
- Ensure you can cycle through the list items using up + down, and can go to another tab by pressing enter or clicking
- Ensure that the extension closes after selecting another tab.