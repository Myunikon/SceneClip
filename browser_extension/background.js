// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "download-clipscene",
    title: "Download with SceneClip",
    contexts: ["page", "link", "video", "audio"]
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download-video" && request.url) {
    // Reuse same logic as Context Menu
    sendToLocalServer(request.url).catch(e => {
      console.warn("Local server connection failed, falling back to protocol handler", e);
      openProtocol(request.url);
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "download-clipscene") {
    // Priority: Link URL > Src URL > Page URL
    const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl;

    if (targetUrl) {
      try {
        await sendToLocalServer(targetUrl, tab?.id);
      } catch (e) {
        console.warn("Local server connection failed, falling back to protocol handler", e);
        // Fallback to Protocol Handler
        openProtocol(targetUrl);
      }
    }
  }
});

async function sendToLocalServer(url, tabId) {
  let cookiesStr = null;
  let userAgent = navigator.userAgent;

  // 1. Try to get Cookies if URL is http/https
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Get all cookies for this domain
      const cookies = await chrome.cookies.getAll({ domain: domain });

      // Format as Netscape/Mozilla cookie file format
      // domain flag path secure expiration name value
      if (cookies && cookies.length > 0) {
        cookiesStr = "# Netscape HTTP Cookie File\n";
        cookies.forEach(c => {
          // Netscape format requires specific columns
          // host \t is_domain_specified \t path \t secure \t expiration \t name \t value
          const host = c.domain.startsWith('.') ? c.domain : '.' + c.domain;
          const flag = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
          const path = c.path;
          const secure = c.secure ? 'TRUE' : 'FALSE';
          const expiration = c.expirationDate ? Math.round(c.expirationDate) : 0;
          const name = c.name;
          const value = c.value;

          cookiesStr += `${host}\t${flag}\t${path}\t${secure}\t${expiration}\t${name}\t${value}\n`;
        });
      }
    } catch (e) {
      console.error("Failed to fetch cookies:", e);
    }
  }

  // 2. Send POST to Local Server
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

  const response = await fetch("http://localhost:19575/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: url,
      cookies: cookiesStr,
      user_agent: userAgent
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error("Server response not OK");
  }
}

function openProtocol(targetUrl) {
  const openUrl = `clipscene://download?url=${encodeURIComponent(targetUrl)}`;

  chrome.tabs.create({ url: openUrl }, (newTab) => {
    setTimeout(() => {
      if (newTab?.id) {
        chrome.tabs.remove(newTab.id).catch(() => { });
      }
    }, 1000);
  });
}
