export const CATALOG_URL = "guides/catalog.json";

export async function loadCatalog() {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
  return response.json();
}

export async function loadGuide(id) {
  const response = await fetch(`guides/${encodeURIComponent(id)}.json`);
  if (!response.ok) throw new Error(`No se pudo cargar la guía "${id}" (${response.status}).`);
  return response.json();
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("GuideKit: el modo offline no se pudo activar.", error);
    });
  }
}
