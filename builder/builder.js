import { validateGuide } from "../src/validation.js";
import { escapeHtml } from "../src/ui.js";

let guide = null;
const fileInput = document.querySelector("#json-file");
const status = document.querySelector("#builder-status");
const editor = document.querySelector("#editor");
const download = document.querySelector("#download");
const sectionsEditor = document.querySelector("#sections-editor");
const collectionsEditor = document.querySelector("#collections-editor");
const quickIndexEditor = document.querySelector("#quick-index-editor");
const validationPanel = document.querySelector("#validation-panel");

const csv = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const slug = (value) => String(value || "").toLowerCase().trim().replace(/[^a-z0-9áéíóúñ]+/gi, "-").replace(/(^-|-$)/g, "");
const markerKinds = ["start", "exit", "poi"];

function renderValidation() {
  const result = validateGuide(guide);
  const messages = [...result.errors.map((item) => `<li class="validation-error">Error: ${item}</li>`), ...result.warnings.map((item) => `<li class="validation-warning">Aviso: ${item}</li>`)];
  validationPanel.innerHTML = `<div class="section-heading"><div><p class="eyebrow">VALIDACIÓN</p><h2>${result.valid ? "Documento listo para revisar" : "Hay errores que corregir"}</h2></div><span class="validation-status ${result.valid ? "valid" : "invalid"}">${result.errors.length} errores · ${result.warnings.length} avisos</span></div>${messages.length ? `<ul class="validation-list">${messages.join("")}</ul>` : "<p class=\"section-intro\">No se detectaron problemas estructurales.</p>"}`;
  download.disabled = !result.valid;
  return result;
}

function renderEditor() {
  if (!guide) return;
  document.querySelectorAll("[data-field]").forEach((field) => {
    const value = guide[field.dataset.field];
    field.value = Array.isArray(value) ? value.join(", ") : (value || "");
    field.oninput = () => {
      guide[field.dataset.field] = ["systems", "genres"].includes(field.dataset.field) ? csv(field.value) : field.value;
      if (field.dataset.field === "title" && !guide.id) guide.id = slug(field.value);
      status.textContent = "Cambios pendientes de exportar.";
      renderValidation();
    };
  });
  sectionsEditor.innerHTML = guide.sections.map((section, index) => `
    <article class="builder-section" data-section="${index}">
      <div class="form-grid"><label>ID<input data-section-field="id" value="${escapeHtml(section.id || "")}"></label><label>Título<input data-section-field="title" value="${escapeHtml(section.title || "")}"></label><label class="full-width">Introducción<textarea data-section-field="intro" rows="2">${escapeHtml(section.intro || "")}</textarea></label></div>
      <label>Pasos (uno por línea; formato: título | contenido)<textarea data-section-field="steps" rows="4">${escapeHtml((section.steps || []).map((step) => `${step.title} | ${step.body}`).join("\n"))}</textarea></label>
      <div class="module-editor"><div class="section-heading"><h3>Mapas visuales</h3><div class="header-actions"><button data-add-grid="${index}" class="toc-toggle" type="button">+ Cuadrícula</button><button data-add-pin="${index}" class="toc-toggle" type="button">+ Pin map</button></div></div><div data-modules="${index}">${renderGridEditors(section, index)}${renderPinEditors(section, index)}</div></div>
    </article>`).join("");
  sectionsEditor.querySelectorAll("[data-section]").forEach((element, index) => {
    element.querySelectorAll("[data-section-field]").forEach((field) => field.addEventListener("input", () => updateSection(index, element)));
  });
  sectionsEditor.querySelectorAll("[data-add-grid]").forEach((button) => button.addEventListener("click", () => addGridModule(Number(button.dataset.addGrid))));
  sectionsEditor.querySelectorAll("[data-add-pin]").forEach((button) => button.addEventListener("click", () => addPinModule(Number(button.dataset.addPin))));
  bindGridEditors();
  bindPinEditors();
  editor.hidden = false;
  renderCollections();
  renderQuickIndex();
  download.disabled = false;
}

function renderGridEditors(section, sectionIndex) {
  return (section.modules || []).map((module, moduleIndex) => {
    if (module.type !== "grid_map") return `<p class="section-intro">Módulo ${escapeHtml(module.type)}: se conserva sin edición visual.</p>`;
    const cells = Array.from({ length: module.width * module.height }, (_, cellIndex) => {
      const x = cellIndex % module.width;
      const y = Math.floor(cellIndex / module.width);
      const marker = (module.markers || []).find((item) => item.x === x && item.y === y);
      return `<button type="button" class="builder-map-cell ${marker ? `cell-${escapeHtml(marker.kind)}` : ""}" data-grid-cell="${sectionIndex}:${moduleIndex}:${x}:${y}" title="${marker ? escapeHtml(marker.label) : "Vacía"}">${marker ? "◆" : ""}</button>`;
    }).join("");
    return `<div class="grid-editor"><div class="form-grid"><label>ID<input data-grid-field="id" data-grid="${sectionIndex}:${moduleIndex}" value="${escapeHtml(module.id || "")}"></label><label>Título<input data-grid-field="title" data-grid="${sectionIndex}:${moduleIndex}" value="${escapeHtml(module.title || "")}"></label><label>Ancho<input type="number" min="1" max="40" data-grid-field="width" data-grid="${sectionIndex}:${moduleIndex}" value="${module.width}"></label><label>Alto<input type="number" min="1" max="40" data-grid-field="height" data-grid="${sectionIndex}:${moduleIndex}" value="${module.height}"></label></div><p class="section-intro">Haz clic en una celda para alternar: vacía → inicio → salida → punto de interés.</p><div class="builder-grid" style="--map-columns:${module.width}">${cells}</div></div>`;
  }).join("");
}

function bindGridEditors() {
  sectionsEditor.querySelectorAll("[data-grid-field]").forEach((field) => field.addEventListener("input", () => {
    const [sectionIndex, moduleIndex] = field.dataset.grid.split(":").map(Number);
    const module = guide.sections[sectionIndex].modules[moduleIndex];
    module[field.dataset.gridField] = ["width", "height"].includes(field.dataset.gridField) ? Math.max(1, Math.min(40, Number(field.value) || 1)) : (field.dataset.gridField === "id" ? slug(field.value) : field.value);
    renderEditor();
    status.textContent = "Cambios pendientes de exportar.";
  }));
  sectionsEditor.querySelectorAll("[data-grid-cell]").forEach((cell) => cell.addEventListener("click", () => {
    const [sectionIndex, moduleIndex, x, y] = cell.dataset.gridCell.split(":").map(Number);
    const module = guide.sections[sectionIndex].modules[moduleIndex];
    module.markers ||= [];
    const markerIndex = module.markers.findIndex((marker) => marker.x === x && marker.y === y);
    if (markerIndex < 0) module.markers.push({ x, y, kind: markerKinds[0], label: "Inicio" });
    else if (markerKinds.indexOf(module.markers[markerIndex].kind) < markerKinds.length - 1) {
      const nextKind = markerKinds[markerKinds.indexOf(module.markers[markerIndex].kind) + 1];
      module.markers[markerIndex] = { ...module.markers[markerIndex], kind: nextKind, label: nextKind === "exit" ? "Salida" : "Punto de interés" };
    } else module.markers.splice(markerIndex, 1);
    renderEditor();
    status.textContent = "Cambios pendientes de exportar.";
  }));
}

function addGridModule(sectionIndex) {
  const section = guide.sections[sectionIndex];
  section.modules ||= [];
  section.modules.push({ type: "grid_map", id: `${section.id}-mapa-${section.modules.length + 1}`, title: "Nuevo mapa", width: 6, height: 4, legend: [{ key: "start", label: "Inicio" }, { key: "exit", label: "Salida" }, { key: "poi", label: "Punto de interés" }], markers: [] });
  renderEditor();
  renderValidation();
}

function renderPinEditors(section, sectionIndex) {
  return (section.modules || []).map((module, moduleIndex) => {
    if (module.type !== "pin_map") return "";
    const pins = module.pins || [];
    return `<div class="grid-editor pin-editor"><div class="form-grid"><label>ID<input data-pin-field="id" data-pin="${sectionIndex}:${moduleIndex}" value="${escapeHtml(module.id || "")}"></label><label>Título<input data-pin-field="title" data-pin="${sectionIndex}:${moduleIndex}" value="${escapeHtml(module.title || "")}"></label><label class="full-width">Imagen base<input data-pin-field="image" data-pin="${sectionIndex}:${moduleIndex}" value="${escapeHtml(module.image || "")}" placeholder="assets/images/juego/mapa.webp"></label><label class="full-width">Texto alternativo<input data-pin-field="alt" data-pin="${sectionIndex}:${moduleIndex}" value="${escapeHtml(module.alt || "")}"></label></div><label>Marcadores (nombre | categoría | X% | Y%)<textarea data-pin-field="pins" data-pin="${sectionIndex}:${moduleIndex}" rows="4">${escapeHtml(pins.map((pin) => `${pin.label || ""} | ${pin.kind || "poi"} | ${pin.x} | ${pin.y}`).join("\n"))}</textarea></label></div>`;
  }).join("");
}

function bindPinEditors() {
  sectionsEditor.querySelectorAll("[data-pin-field]").forEach((field) => field.addEventListener("input", () => {
    const [sectionIndex, moduleIndex] = field.dataset.pin.split(":").map(Number);
    const module = guide.sections[sectionIndex].modules[moduleIndex];
    const key = field.dataset.pinField;
    if (key === "pins") {
      module.pins = field.value.split("\n").filter(Boolean).map((line, index) => {
        const [label, kind = "poi", x = "0", y = "0"] = line.split("|");
        return { id: `${module.id}-pin-${index + 1}`, label: label.trim(), kind: kind.trim(), x: Number(x) || 0, y: Number(y) || 0 };
      });
    } else module[key] = key === "id" ? slug(field.value) : field.value;
    status.textContent = "Cambios pendientes de exportar.";
    renderValidation();
  }));
}

function addPinModule(sectionIndex) {
  const section = guide.sections[sectionIndex];
  section.modules ||= [];
  section.modules.push({ type: "pin_map", id: `${section.id}-pin-map-${section.modules.length + 1}`, title: "Nuevo pin map", image: "", alt: "", pins: [] });
  renderEditor();
  renderValidation();
}

function ensureDatasets() {
  guide.datasets ||= {};
  guide.datasets.collections ||= [];
  return guide.datasets.collections;
}

function renderCollections() {
  const collections = ensureDatasets();
  collectionsEditor.innerHTML = collections.map((collection, index) => `
    <article class="builder-section" data-collection="${index}">
      <div class="form-grid"><label>ID<input data-collection-field="id" value="${escapeHtml(collection.id || `coleccion-${index + 1}`)}"></label><label>Título<input data-collection-field="title" value="${escapeHtml(collection.title || "Nueva colección")}"></label></div>
      <label>Entidades (una por línea; formato: nombre | categoría | descripción)<textarea data-collection-field="items" rows="4">${escapeHtml((collection.items || []).map((item) => `${item.name || ""} | ${item.category || ""} | ${item.description || ""}`).join("\n"))}</textarea></label>
    </article>`).join("");
  collectionsEditor.querySelectorAll("[data-collection]").forEach((element, index) => {
    element.querySelectorAll("[data-collection-field]").forEach((field) => field.addEventListener("input", () => updateCollection(index, element)));
  });
}

function updateCollection(index, element) {
  const fields = Object.fromEntries([...element.querySelectorAll("[data-collection-field]")].map((field) => [field.dataset.collectionField, field.value]));
  const collection = ensureDatasets()[index];
  collection.id = slug(fields.id || fields.title);
  collection.title = fields.title;
  collection.items = fields.items.split("\n").filter(Boolean).map((line, itemIndex) => {
    const [name, category, ...description] = line.split("|");
    return { id: `${collection.id}-${itemIndex + 1}`, name: name.trim(), category: category.trim(), description: description.join("|").trim() };
  });
  status.textContent = "Cambios pendientes de exportar.";
  renderValidation();
}

function renderQuickIndex() {
  quickIndexEditor.value = (guide.quickIndex || []).map((item) => `${item.label} | ${item.target} | ${item.tone || "cyan"}`).join("\n");
}

function updateQuickIndex() {
  guide.quickIndex = quickIndexEditor.value.split("\n").filter(Boolean).map((line, index) => {
    const [label, target, tone = "cyan"] = line.split("|");
    return { id: slug(label) || `acceso-${index + 1}`, label: label.trim(), target: target.trim(), tone: tone.trim() };
  });
  status.textContent = "Cambios pendientes de exportar.";
  renderValidation();
}

function updateSection(index, element) {
  const fields = Object.fromEntries([...element.querySelectorAll("[data-section-field]")].map((field) => [field.dataset.sectionField, field.value]));
  guide.sections[index].id = slug(fields.id || fields.title);
  guide.sections[index].title = fields.title;
  guide.sections[index].intro = fields.intro;
  guide.sections[index].steps = fields.steps.split("\n").filter(Boolean).map((line, stepIndex) => {
    const [title, ...body] = line.split("|");
    return { id: `${guide.sections[index].id}-paso-${stepIndex + 1}`, title: title.trim(), body: body.join("|").trim(), checkable: true };
  });
  status.textContent = "Cambios pendientes de exportar.";
  renderValidation();
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    guide = JSON.parse(await file.text());
    if (!guide.id || !guide.title || !Array.isArray(guide.sections)) throw new Error("Faltan campos requeridos: id, title o sections.");
    status.textContent = `${guide.title} cargada.`;
    renderEditor();
    renderValidation();
  } catch (error) {
    guide = null; editor.hidden = true; download.disabled = true; status.textContent = `Error: ${error.message}`;
  }
});

document.querySelector("#add-section").addEventListener("click", () => {
  if (!guide) return;
  guide.sections.push({ id: `seccion-${guide.sections.length + 1}`, title: "Nueva sección", intro: "", steps: [] });
  renderEditor();
  renderValidation();
});

document.querySelector("#add-collection").addEventListener("click", () => {
  if (!guide) return;
  ensureDatasets().push({ id: `coleccion-${ensureDatasets().length + 1}`, title: "Nueva colección", items: [] });
  renderCollections();
  renderValidation();
});

quickIndexEditor.addEventListener("input", updateQuickIndex);

download.addEventListener("click", () => {
  if (!guide || !renderValidation().valid) return;
  guide.id = slug(guide.id);
  const blob = new Blob([JSON.stringify(guide, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `${guide.id || "guidekit-guide"}.json`; link.click();
  URL.revokeObjectURL(url);
});
