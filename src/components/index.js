import { escapeHtml } from "../ui.js";

function renderValue(value) {
  if (Array.isArray(value)) return value.map((item) => escapeHtml(item)).join(", ");
  if (value && typeof value === "object") return Object.entries(value)
    .map(([key, item]) => `<span><b>${escapeHtml(key)}:</b> ${escapeHtml(item)}</span>`).join("");
  return escapeHtml(value ?? "");
}

export function renderCollection(collection) {
  const columns = collection.columns || [];
  const rows = collection.rows || collection.items || [];
  if (!rows.length) return "";
  if (columns.length) {
    return `<section class="data-component" data-collection><p class="eyebrow">DATOS</p><div class="data-heading"><h3>${escapeHtml(collection.title)}</h3><label class="collection-search"><span aria-hidden="true">⌕</span><input data-collection-filter type="search" placeholder="Filtrar ${escapeHtml(collection.title.toLowerCase())}" autocomplete="off"></label></div><div class="data-table-wrap"><table><thead><tr>${columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr data-collection-row>${columns.map((column, index) => `<td>${renderValue(Array.isArray(row) ? row[index] : row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
  }
  return `<section class="data-component" data-collection><p class="eyebrow">COLECCIÓN</p><div class="data-heading"><h3>${escapeHtml(collection.title)}</h3><label class="collection-search"><span aria-hidden="true">⌕</span><input data-collection-filter type="search" placeholder="Filtrar ${escapeHtml(collection.title.toLowerCase())}" autocomplete="off"></label></div><div class="entity-grid">${rows.map((item) => `<article data-collection-row><h4>${escapeHtml(item.name || item.title || item.id)}</h4>${item.category ? `<span class="data-category">${escapeHtml(item.category)}</span>` : ""}${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}${item.attributes ? `<div class="data-attributes">${renderValue(item.attributes)}</div>` : ""}</article>`).join("")}</div></section>`;
}

export function renderDatasets(datasets = {}) {
  const collections = [
    ...(datasets.collections || []),
    ...["enemies", "bosses", "items"].filter((key) => datasets[key]?.length).map((key) => ({
      id: key, title: key === "enemies" ? "Enemigos" : key === "bosses" ? "Jefes" : "Objetos", items: datasets[key]
    })),
    ...(datasets.tables || [])
  ];
  return collections.map(renderCollection).join("");
}

export function bindCollectionFilters(root) {
  root.querySelectorAll("[data-collection]").forEach((collection) => {
    const input = collection.querySelector("[data-collection-filter]");
    const rows = collection.querySelectorAll("[data-collection-row]");
    input?.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      rows.forEach((row) => { row.hidden = query && !row.textContent.toLowerCase().includes(query); });
    });
  });
}
