chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_PAGE") {
    const key = `archive_${Date.now()}`;
    chrome.storage.local.set({ [key]: msg.payload }, () => {
      console.log("Page archived:", msg.payload);
      sendResponse({ success: true, key: key });
    });
    return true;
  }
});
