export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

export function inlineMarkdown(value = "", keywords = []) {
  let html = escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
  const uniqueKeywords = [...new Map(keywords.map((keyword) => [keyword.toLowerCase(), keyword])).values()]
    .sort((a, b) => b.length - a.length);
  for (const keyword of uniqueKeywords) {
    const safe = escapeHtml(keyword);
    const expression = safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`(?<![\\w-])(${expression})(?![\\w-])`, "gi"), "<mark>$1</mark>");
  }
  return html;
}

export function setupTheme() {
  const stored = localStorage.getItem("guidekit-theme");
  if (stored) document.documentElement.dataset.theme = stored;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("guidekit-theme", next);
    });
  });
}
