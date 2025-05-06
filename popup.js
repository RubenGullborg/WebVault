document.getElementById("archiveBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Tjek om URL er en chrome:// URL
  if (tab.url && tab.url.startsWith("chrome://")) {
    document.getElementById("status").textContent = "Cannot archive Chrome system pages";
    setTimeout(() => {
      document.getElementById("status").textContent = "";
    }, 3000);
    return;
  }
  
  document.getElementById("status").textContent = "Archiving...";

  try {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const content = {
          title: document.title,
          url: window.location.href,
          body: document.body.innerText,
          html: document.documentElement.outerHTML,
          timestamp: new Date().toISOString()
        };
        return content;
      }
    }, (results) => {
      // Sikre at results findes og har et element med et result
      if (results && results.length > 0 && results[0] && results[0].result) {
        chrome.runtime.sendMessage(
          { type: "SAVE_PAGE", payload: results[0].result },
          (response) => {
            if (response && response.success) {
              document.getElementById("status").textContent = "Page archived successfully";
              setTimeout(() => {
                document.getElementById("status").textContent = "";
              }, 3000);
            } else {
              document.getElementById("status").textContent = "Failed to archive page";
            }
          }
        );
      } else {
        document.getElementById("status").textContent = "Failed to extract page content";
      }
    });
  } catch (error) {
    document.getElementById("status").textContent = "Error: " + (error.message || "Unknown error");
  }
});
