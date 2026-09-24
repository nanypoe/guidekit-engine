import { escapeHtml } from "../ui.js";

function renderGridMap(module) {
  const cells = Array.from({ length: module.width * module.height }, (_, index) => {
    const x = index % module.width;
    const y = Math.floor(index / module.width);
    const marker = module.markers?.find((item) => item.x === x && item.y === y);
    return `<div class="map-cell ${marker ? `cell-${escapeHtml(marker.kind)}` : ""}" title="${marker ? escapeHtml(marker.label) : ""}">${marker ? "◆" : ""}</div>`;
  }).join("");
  return `<div class="module-card"><p class="eyebrow">MAPA INTERACTIVO</p><h3>${escapeHtml(module.title)}</h3><div class="grid-map" style="--map-columns:${module.width}">${cells}</div><div class="legend">${(module.legend || []).map((item) => `<span><i class="cell-${escapeHtml(item.key)}"></i>${escapeHtml(item.label)}</span>`).join("")}</div></div>`;
}

function renderPinMap(module) {
  const pins = (module.pins || []).map((pin) => `<button class="map-pin pin-${escapeHtml(pin.kind || "default")}" style="left:${pin.x}%;top:${pin.y}%" title="${escapeHtml(pin.label)}" type="button">●</button>`).join("");
  return `<div class="module-card"><p class="eyebrow">PIN MAP</p><h3>${escapeHtml(module.title)}</h3><div class="pin-map">${module.image ? `<img src="${escapeHtml(module.image)}" alt="${escapeHtml(module.alt || module.title)}" loading="lazy">` : ""}${pins}</div></div>`;
}

function renderTimeline(module) {
  return `<div class="module-card"><p class="eyebrow">RUTA SECUENCIAL</p><h3>${escapeHtml(module.title)}</h3><ol class="timeline">${(module.steps || []).map((step) => `<li><b>${escapeHtml(step.title)}</b><span>${escapeHtml(step.text || "")}</span></li>`).join("")}</ol></div>`;
}

function renderDecisionTree(module) {
  return `<div class="module-card"><p class="eyebrow">ÁRBOL DE DECISIÓN</p><h3>${escapeHtml(module.title)}</h3><div class="decision-tree">${(module.nodes || []).map((node) => `<article><b>${escapeHtml(node.title)}</b><span>${escapeHtml(node.text || "")}</span></article>`).join("")}</div></div>`;
}

function renderInteractiveTool(module) {
  const options = (module.options || []).map((option) => `<li><b>${escapeHtml(option.label)}</b><span>${escapeHtml(option.description || "")}</span></li>`).join("");
  return `<div class="module-card"><p class="eyebrow">HERRAMIENTA</p><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.description || "")}</p>${options ? `<ul class="tool-options">${options}</ul>` : ""}</div>`;
}

const renderers = {
  grid_map: renderGridMap,
  pin_map: renderPinMap,
  timeline_route: renderTimeline,
  decision_tree: renderDecisionTree,
  interactive_tool: renderInteractiveTool
};

export function renderModule(module) {
  const renderer = renderers[module.type] || renderInteractiveTool;
  return renderer(module);
}

export const supportedModules = Object.freeze(Object.keys(renderers));
