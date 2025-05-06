document.addEventListener("DOMContentLoaded", function () {
  const snapshotsContainer = document.getElementById("snapshotsContainer");
  const searchInput = document.getElementById("searchInput");

  // Load all snapshots from storage
  function loadSnapshots() {
    chrome.storage.local.get(null, function (items) {
      const snapshots = [];

      // Filter out only archive entries
      for (const key in items) {
        if (key.startsWith("archive_")) {
          const snapshot = items[key];
          snapshot.key = key;
          snapshots.push(snapshot);
        }
      }

      if (snapshots.length === 0) {
        snapshotsContainer.innerHTML = `
          <div class="empty-state">
            <p>No snapshots saved yet.</p>
            <p>Use the extension popup to save snapshots of webpages you visit.</p>
          </div>
        `;
      } else {
        displaySnapshots(snapshots);
      }
    });
  }

  // Display snapshots in the UI
  function displaySnapshots(snapshots) {
    // Sort snapshots by timestamp, newest first
    snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const searchTerm = searchInput.value.toLowerCase().trim();
    const filteredSnapshots = searchTerm
      ? snapshots.filter(
          (snapshot) =>
            snapshot.title.toLowerCase().includes(searchTerm) ||
            snapshot.url.toLowerCase().includes(searchTerm) ||
            snapshot.body.toLowerCase().includes(searchTerm)
        )
      : snapshots;

    if (filteredSnapshots.length === 0) {
      snapshotsContainer.innerHTML = `
        <div class="empty-state">
          <p>No snapshots match your search.</p>
        </div>
      `;
      return;
    }

    const snapshotsList = document.createElement("ul");
    snapshotsList.className = "snapshot-list";

    filteredSnapshots.forEach((snapshot) => {
      const item = document.createElement("li");
      item.className = "snapshot-item";

      // Format date for display
      const date = new Date(snapshot.timestamp);
      const formattedDate = date.toLocaleString();

      // Create a preview of the body text
      const previewText =
        snapshot.body.substring(0, 200) +
        (snapshot.body.length > 200 ? "..." : "");

      item.innerHTML = `
        <div class="snapshot-title">${snapshot.title}</div>
        <div class="snapshot-url">${snapshot.url}</div>
        <div class="snapshot-date">📅 ${formattedDate}</div>
        <div class="snapshot-preview">${previewText}</div>
        <div class="actions">
          <button class="view-btn" data-key="${snapshot.key}">View Full Content</button>
          <button class="delete-btn" data-key="${snapshot.key}">Delete</button>
        </div>
      `;

      snapshotsList.appendChild(item);
    });

    snapshotsContainer.innerHTML = "";
    snapshotsContainer.appendChild(snapshotsList);

    // Add event listeners to buttons
    document.querySelectorAll(".view-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const key = this.getAttribute("data-key");
        viewSnapshot(key);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const key = this.getAttribute("data-key");
        deleteSnapshot(key);
      });
    });
  }

  // View a single snapshot in detail
  function viewSnapshot(key) {
    chrome.storage.local.get(key, function (result) {
      const snapshot = result[key];

      // Create a new window/tab with the snapshot content
      const viewerWindow = window.open("", "_blank");

      if (!viewerWindow) {
        alert(
          "Pop-up blocked. Please allow pop-ups for this site to view snapshots."
        );
        return;
      }

      const date = new Date(snapshot.timestamp);
      const formattedDate = date.toLocaleString();

      viewerWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${snapshot.title} - WebVault Snapshot</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            header {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .url {
              color: #0078d7;
              word-break: break-all;
              margin-bottom: 5px;
            }
            .timestamp {
              color: #666;
            }
            .content {
              white-space: pre-wrap;
              background-color: white;
              padding: 15px;
              border: 1px solid #eee;
              border-radius: 4px;
            }
            .back-btn {
              background-color: #0078d7;
              color: white;
              border: none;
              padding: 8px 15px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <header>
            <div class="title">${snapshot.title}</div>
            <div class="url">${snapshot.url}</div>
            <div class="timestamp">Archived on: ${formattedDate}</div>
          </header>
          
          <div class="content">${snapshot.body}</div>
          
          <button class="back-btn" onclick="window.close()">Close</button>
        </body>
        </html>
      `);

      viewerWindow.document.close();
    });
  }

  // Delete a snapshot
  function deleteSnapshot(key) {
    if (confirm("Are you sure you want to delete this snapshot?")) {
      chrome.storage.local.remove(key, function () {
        loadSnapshots();
      });
    }
  }

  // Initialize
  loadSnapshots();

  searchInput.addEventListener("input", function () {
    loadSnapshots();
  });
});
