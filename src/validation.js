const MODULE_TYPES = new Set(["grid_map", "pin_map", "decision_tree", "interactive_tool", "timeline_route"]);

export function validateGuide(guide) {
  const errors = [];
  const warnings = [];
  const ids = new Map();
  const addId = (id, location) => {
    if (!id) errors.push(`${location}: falta id.`);
    else if (ids.has(id)) errors.push(`${location}: id duplicado "${id}".`);
    else ids.set(id, location);
  };
  const visitToc = (items = [], location = "tableOfContents") => {
    for (const item of items) {
      if (!ids.has(item.id)) warnings.push(`${location}: referencia sin destino "${item.id}".`);
      visitToc(item.children, `${location}.${item.id}.children`);
    }
  };

  if (!guide || typeof guide !== "object") return { errors: ["guide: el documento debe ser un objeto."], warnings: [], valid: false };
  addId(guide.id, "guide");
  if (!guide.title?.trim()) errors.push("guide.title: es obligatorio.");
  if (!Array.isArray(guide.systems) || !guide.systems.length) errors.push("guide.systems: debe contener al menos un sistema.");
  if (!Array.isArray(guide.genres) || !guide.genres.length) errors.push("guide.genres: debe contener al menos un género.");
  if (guide.language && guide.language !== "es") warnings.push("guide.language: la aplicación está preparada para contenido en español.");
  const sourceIds = new Set();
  for (const [sourceIndex, source] of (guide.sources || []).entries()) {
    if (!source.id) errors.push(`sources[${sourceIndex}]: falta id.`);
    else if (sourceIds.has(source.id)) errors.push(`sources[${sourceIndex}]: id duplicado "${source.id}".`);
    else sourceIds.add(source.id);
    if (!source.title?.trim()) errors.push(`sources[${sourceIndex}].title: es obligatorio.`);
    if (!source.license?.trim()) errors.push(`sources[${sourceIndex}].license: es obligatorio.`);
    if (source.url) {
      try {
        const protocol = new URL(source.url).protocol;
        if (!["http:", "https:"].includes(protocol)) errors.push(`sources[${sourceIndex}].url: solo se permiten URLs HTTP o HTTPS.`);
      } catch {
        errors.push(`sources[${sourceIndex}].url: URL inválida.`);
      }
    }
  }

  for (const [sectionIndex, section] of (guide.sections || []).entries()) {
    addId(section.id, `sections[${sectionIndex}]`);
    for (const [stepIndex, step] of (section.steps || []).entries()) addId(step.id, `sections[${sectionIndex}].steps[${stepIndex}]`);
    for (const [moduleIndex, module] of (section.modules || []).entries()) {
      addId(module.id, `sections[${sectionIndex}].modules[${moduleIndex}]`);
      if (!MODULE_TYPES.has(module.type)) errors.push(`modules.${module.id || moduleIndex}: tipo no registrado "${module.type}".`);
      if (module.type === "grid_map" && (!Number.isInteger(module.width) || !Number.isInteger(module.height))) {
        errors.push(`modules.${module.id}: grid_map requiere width y height enteros.`);
      }
      if (module.type === "grid_map" && Number.isInteger(module.width) && Number.isInteger(module.height)) {
        for (const marker of module.markers || []) {
          if (!Number.isInteger(marker.x) || !Number.isInteger(marker.y) || marker.x < 0 || marker.x >= module.width || marker.y < 0 || marker.y >= module.height) {
            errors.push(`modules.${module.id}: marcador fuera de los límites del mapa.`);
          }
        }
      }
      if (module.type === "pin_map") {
        if (!module.image?.trim()) warnings.push(`modules.${module.id}: pin_map no tiene imagen base.`);
        if (!module.alt?.trim()) warnings.push(`modules.${module.id}: pin_map requiere texto alternativo.`);
        for (const pin of module.pins || []) {
          if (typeof pin.x !== "number" || typeof pin.y !== "number" || pin.x < 0 || pin.x > 100 || pin.y < 0 || pin.y > 100) {
            errors.push(`modules.${module.id}: pin fuera de rango 0-100.`);
          }
        }
      }
      if (module.type === "decision_tree") {
        const nodeIds = new Set();
        for (const [nodeIndex, node] of (module.nodes || []).entries()) {
          if (!node.id) errors.push(`modules.${module.id}.nodes[${nodeIndex}]: falta id.`);
          else if (nodeIds.has(node.id)) errors.push(`modules.${module.id}.nodes[${nodeIndex}]: id duplicado "${node.id}".`);
          else nodeIds.add(node.id);
          if (!node.title?.trim()) warnings.push(`modules.${module.id}.nodes[${nodeIndex}].title: falta título.`);
          addId(node.id, `sections[${sectionIndex}].modules[${moduleIndex}].nodes[${nodeIndex}]`);
        }
        for (const node of module.nodes || []) {
          for (const target of node.next || []) {
            if (!nodeIds.has(target)) errors.push(`modules.${module.id}.nodes.${node.id}: referencia inexistente "${target}".`);
          }
        }
      }
      if (module.type === "timeline_route") {
        const stepIds = new Set();
        for (const [stepIndex, step] of (module.steps || []).entries()) {
          if (!step.id) errors.push(`modules.${module.id}.steps[${stepIndex}]: falta id.`);
          else if (stepIds.has(step.id)) errors.push(`modules.${module.id}.steps[${stepIndex}]: id duplicado "${step.id}".`);
          else stepIds.add(step.id);
          if (!step.title?.trim()) warnings.push(`modules.${module.id}.steps[${stepIndex}].title: falta título.`);
          addId(step.id, `sections[${sectionIndex}].modules[${moduleIndex}].steps[${stepIndex}]`);
        }
      }
      if (module.type === "interactive_tool") {
        if (!module.description?.trim()) warnings.push(`modules.${module.id}: interactive_tool no tiene descripción.`);
        const optionIds = new Set();
        for (const [optionIndex, option] of (module.options || []).entries()) {
          if (!option.id) errors.push(`modules.${module.id}.options[${optionIndex}]: falta id.`);
          else if (optionIds.has(option.id)) errors.push(`modules.${module.id}.options[${optionIndex}]: id duplicado "${option.id}".`);
          else optionIds.add(option.id);
          if (!option.label?.trim()) warnings.push(`modules.${module.id}.options[${optionIndex}].label: falta etiqueta.`);
          addId(option.id, `sections[${sectionIndex}].modules[${moduleIndex}].options[${optionIndex}]`);
        }
      }
    }
  }
  for (const [collectionIndex, collection] of (guide.datasets?.collections || []).entries()) {
    addId(collection.id, `datasets.collections[${collectionIndex}]`);
    if (!collection.title?.trim()) errors.push(`datasets.collections[${collectionIndex}].title: es obligatorio.`);
    for (const [itemIndex, item] of (collection.items || []).entries()) {
      if (!item.name?.trim()) warnings.push(`datasets.collections[${collectionIndex}].items[${itemIndex}]: falta nombre.`);
    }
  }
  for (const item of guide.quickIndex || []) if (!ids.has(item.target)) warnings.push(`quickIndex.${item.id}: referencia sin destino "${item.target}".`);
  visitToc(guide.tableOfContents);
  const seenKeywords = new Set();
  for (const keyword of guide.keywords || []) {
    const normalized = keyword.toLowerCase();
    if (seenKeywords.has(normalized)) warnings.push(`keywords: término duplicado "${keyword}".`);
    seenKeywords.add(normalized);
  }
  return { guide: guide.id, errors, warnings, valid: errors.length === 0 };
}
