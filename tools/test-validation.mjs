import assert from "node:assert/strict";
import fs from "node:fs";
import { validateGuide } from "../src/validation.js";

const pilot = JSON.parse(fs.readFileSync(new URL("../guides/smt-strange-journey.json", import.meta.url)));

function cloneGuide() {
  return structuredClone(pilot);
}

function assertValid(guide, message) {
  const result = validateGuide(guide);
  assert.equal(result.valid, true, `${message}: ${JSON.stringify(result)}`);
}

function assertInvalid(guide, expectedText, message) {
  const result = validateGuide(guide);
  assert.equal(result.valid, false, `${message}: el documento debería ser inválido`);
  assert.ok(result.errors.some((error) => error.includes(expectedText)), `${message}: no se encontró "${expectedText}"`);
}

assertValid(cloneGuide(), "la guía piloto debe ser válida");

{
  const guide = cloneGuide();
  guide.sections[0].modules ||= [];
  guide.sections[0].modules.push({
    type: "pin_map",
    id: "test-pin-map",
    title: "Mapa",
    image: "map.webp",
    alt: "Mapa de prueba",
    pins: [{ id: "pin-1", label: "Fuera", x: 101, y: 50 }]
  });
  assertInvalid(guide, "pin fuera de rango", "pin_map debe limitar coordenadas");
}

{
  const guide = cloneGuide();
  guide.sections[0].modules ||= [];
  guide.sections[0].modules.push({
    type: "decision_tree",
    id: "test-decision",
    title: "Decisión",
    nodes: [{ id: "inicio", title: "Inicio", next: ["no-existe"] }]
  });
  assertInvalid(guide, "referencia inexistente", "decision_tree debe validar conexiones");
}

{
  const guide = cloneGuide();
  guide.sections[0].modules ||= [];
  guide.sections[0].modules.push({
    type: "timeline_route",
    id: "test-timeline",
    title: "Ruta",
    steps: [{ id: "paso", title: "Primero" }, { id: "paso", title: "Duplicado" }]
  });
  assertInvalid(guide, "id duplicado", "timeline_route debe validar IDs");
}

{
  const guide = cloneGuide();
  guide.sections[0].modules ||= [];
  guide.sections[0].modules.push({
    type: "interactive_tool",
    id: "test-tool",
    title: "Herramienta",
    description: "Prueba",
    options: [{ id: "option", label: "Una opción" }]
  });
  assertValid(guide, "interactive_tool válido");
}

{
  const guide = cloneGuide();
  guide.sections[0].modules ||= [];
  guide.sections[0].modules.push({
    type: "interactive_tool",
    id: "test-tool",
    title: "Herramienta",
    options: [{ id: "option", label: "Primera" }, { id: "option", label: "Duplicada" }]
  });
  assertInvalid(guide, "id duplicado", "interactive_tool debe validar IDs");
}

{
  const guide = cloneGuide();
  guide.sources = [{ id: "manual", title: "Manual oficial", license: "Uso autorizado" }];
  assertValid(guide, "fuente con licencia");
}

{
  const guide = cloneGuide();
  guide.sources = [{ id: "manual", title: "Manual oficial" }];
  assertInvalid(guide, "sources[0].license", "las fuentes deben declarar licencia");
}

{
  const guide = cloneGuide();
  guide.sources = [{ id: "manual", title: "Manual oficial", license: "Uso autorizado", url: "javascript:alert(1)" }];
  assertInvalid(guide, "solo se permiten URLs", "las fuentes deben usar URLs seguras");
}

console.log("Validation tests passed: 9 cases");
