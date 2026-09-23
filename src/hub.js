import { loadCatalog, registerServiceWorker } from "./data.js";
import { escapeHtml, setupTheme } from "./ui.js";

const catalogElement = document.querySelector("#guide-catalog");
let guides = [];
let view = "grid";

function render() {
  const query = document.querySelector("#guide-search").value.trim().toLowerCase();
  const filtered = guides.filter((guide) => [guide.title, ...guide.systems, ...guide.genres].join(" ").toLowerCase().includes(query));
  catalogElement.className = `guide-catalog ${view === "list" ? "list-view" : ""}`;
  catalogElement.innerHTML = filtered.length ? filtered.map((guide) => `
    <a class="guide-card" href="viewer.html?guide=${encodeURIComponent(guide.id)}">
      <div class="guide-cover">${guide.cover ? `<img src="${escapeHtml(guide.cover)}" alt="">` : `<span>${escapeHtml(guide.title.slice(0, 1))}</span>`}</div>
      <div class="guide-card-body"><p class="eyebrow">${escapeHtml(guide.status || "publicada")}</p>
        <h3>${escapeHtml(guide.title)}</h3><p>${escapeHtml(guide.description || "")}</p>
        <div class="tag-row">${guide.systems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}${guide.genres.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      </div>
    </a>`).join("") : `<p class="empty-state">No encontramos una guía con ese filtro.</p>`;
}

async function init() {
  setupTheme();
  registerServiceWorker();
  document.querySelector("#guide-search").addEventListener("input", render);
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    view = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
    render();
  }));
  try { guides = await loadCatalog(); render(); }
  catch (error) { catalogElement.innerHTML = `<p class="error-state">${escapeHtml(error.message)}</p>`; }
}
init();
