const input = document.getElementById("appUrl");
const saveBtn = document.getElementById("saveBtn");
const saved = document.getElementById("saved");

chrome.storage.sync.get("appUrl").then(({ appUrl }) => {
  if (appUrl) input.value = appUrl;
});

saveBtn.addEventListener("click", async () => {
  const value = input.value.trim().replace(/\/+$/, "");
  if (!value) return;
  await chrome.storage.sync.set({ appUrl: value });
  saved.textContent = "Saved.";
  setTimeout(() => (saved.textContent = ""), 2000);
});
