const copyBtn = document.getElementById("copyBtn");
const openBtn = document.getElementById("openBtn");
const allWindows = document.getElementById("allWindows");
const status = document.getElementById("status");
const optionsLink = document.getElementById("options-link");

function setStatus(text, ok) {
  status.textContent = text;
  status.className = ok ? "ok" : "";
}

async function collectTabUrls() {
  const queryInfo = allWindows.checked ? {} : { currentWindow: true };
  const tabs = await chrome.tabs.query(queryInfo);
  return tabs
    .map((t) => t.url)
    .filter((url) => url && /^https?:\/\//i.test(url));
}

copyBtn.addEventListener("click", async () => {
  try {
    const urls = await collectTabUrls();
    if (urls.length === 0) {
      setStatus("No http(s) tabs found to copy.", false);
      return;
    }
    await navigator.clipboard.writeText(urls.join("\n"));
    setStatus(`Copied ${urls.length} URL(s). Paste into Save Session.`, true);
  } catch (err) {
    setStatus(`Could not copy: ${err.message}`, false);
  }
});

openBtn.addEventListener("click", async () => {
  const { appUrl } = await chrome.storage.sync.get("appUrl");
  if (!appUrl) {
    setStatus("Set your app URL first (link below).", false);
    return;
  }
  const base = appUrl.replace(/\/+$/, "");
  chrome.tabs.create({ url: `${base}/save-session` });
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Show the current app URL (or a reminder to set one) as soon as the popup opens.
chrome.storage.sync.get("appUrl").then(({ appUrl }) => {
  if (!appUrl) setStatus("Tip: set your app URL below for one-click Open.", false);
});
