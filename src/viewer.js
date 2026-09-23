import { loadGuide, registerServiceWorker } from "./data.js";
import { escapeHtml, inlineMarkdown, setupTheme } from "./ui.js";
import { renderModule } from "./modules/index.js";
import { bindCollectionFilters, renderDatasets } from "./components/index.js";

const app = document.querySelector("#viewer-app");
const drawer = document.querySelector("[data-toc-drawer]");
const backdrop = document.querySelector("[data-toc-close]");
const progressKey = (id) => `guidekit-progress:${id}`;
let guide;

function tocItems(items = []) {
  return `<ul>${items.map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>${item.children ? tocItems(item.children) : ""}</li>`).join("")}</ul>`;
}

function renderImages(images = [], position) {
  return images.filter((image) => (image.position || "after") === position).map((image) => `
    <figure class="guide-image"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy">${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}</figure>`).join("");
}

function render() {
  const progress = JSON.parse(localStorage.getItem(progressKey(guide.id)) || "{}");
  app.innerHTML = `<section class="guide-intro"><a class="back-link" href="./">← Catálogo</a><p class="eyebrow">${escapeHtml(guide.franchise || guide.genres.join(" · "))}</p><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.summary || "")}</p><div class="tag-row">${guide.systems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section>
    <nav class="quick-index" aria-label="Índice rápido">${(guide.quickIndex || []).map((item) => `<a class="quick-card tone-${escapeHtml(item.tone || "cyan")}" href="#${escapeHtml(item.target)}"><span>${escapeHtml(item.label)}</span><b>→</b></a>`).join("")}</nav>
    <div class="guide-content">${guide.sections.map((section) => `<section class="guide-section" id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${section.intro ? `<p class="section-intro">${escapeHtml(section.intro)}</p>` : ""}${(section.steps || []).map((step) => `<article class="step-card" id="${escapeHtml(step.id)}">${step.checkable ? `<label class="check-row"><input type="checkbox" data-step="${escapeHtml(step.id)}" ${progress[step.id] ? "checked" : ""}><span>Completado</span></label>` : ""}${renderImages(step.images, "before")}<h3>${escapeHtml(step.title)}</h3><p>${inlineMarkdown(step.body, guide.keywords || [])}</p>${renderImages(step.images, "after")}${step.callout ? `<aside class="callout callout-${escapeHtml(step.callout.type)}"><b>${escapeHtml(step.callout.label)}</b><span>${inlineMarkdown(step.callout.text, guide.keywords || [])}</span></aside>` : ""}</article>`).join("")}${(section.modules || []).map(renderModule).join("")}</section>`).join("")}${renderDatasets(guide.datasets)}</div>`;
  drawer.innerHTML = `<div class="drawer-heading"><p class="eyebrow">NAVEGACIÓN</p><h2>${escapeHtml(guide.title)}</h2></div>${tocItems(guide.tableOfContents || [])}`;
  app.querySelectorAll("[data-step]").forEach((input) => input.addEventListener("change", () => {
    const next = JSON.parse(localStorage.getItem(progressKey(guide.id)) || "{}");
    next[input.dataset.step] = input.checked;
    localStorage.setItem(progressKey(guide.id), JSON.stringify(next));
  }));
  drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDrawer));
  bindCollectionFilters(app);
}

function openDrawer() { drawer.classList.add("open"); backdrop.hidden = false; }
function closeDrawer() { drawer.classList.remove("open"); backdrop.hidden = true; }

async function init() {
  setupTheme(); registerServiceWorker();
  document.querySelectorAll("[data-toc-toggle]").forEach((button) => button.addEventListener("click", openDrawer));
  backdrop.addEventListener("click", closeDrawer);
  const id = new URLSearchParams(location.search).get("guide") || "smt-strange-journey";
  try { guide = await loadGuide(id); render(); }
  catch (error) { app.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
}
init();
