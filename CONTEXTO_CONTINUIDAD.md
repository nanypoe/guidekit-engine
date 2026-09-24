# GuideKit Engine — Contexto de continuidad

## Propósito de este archivo

Este documento está dirigido a la siguiente IA que continúe el proyecto. Resume
la visión, las decisiones ya tomadas, el estado real del repositorio, lo que está
completo, lo que está parcial, los riesgos conocidos y el flujo recomendado para
seguir trabajando sin repetir tareas ni asumir que la guía de SMT ya está lista.

La instrucción principal es **continuar implementando y verificando**, no limitarse
a proponer planes. Antes de editar, leer el estado actual y respetar los cambios
existentes del working tree. No borrar ni revertir cambios ajenos.

---

## 1. Visión del producto

GuideKit Engine es una aplicación web open source para crear, editar y consumir
guías interactivas de videojuegos.

Tiene dos superficies separadas:

1. **Viewer**: experiencia para el usuario final que consume la guía durante el
   juego. Debe ser táctil, responsive, clara, ligera y offline-first.
2. **Builder**: experiencia para diseñadores, creadores y editores. Debe permitir
   crear contenido sin editar JSON manualmente, validar y exportar guías.

La aplicación debe funcionar sobre GitHub Pages, sin backend obligatorio, usando
HTML, CSS, JavaScript ES modules y JSON data-driven. SMT: Strange Journey es solo
el primer caso piloto; ningún contrato, componente o módulo nuevo debe quedar
acoplado exclusivamente a SMT.

El documento original de visión es
[GuideKit_Engine.txt](./GuideKit_Engine.txt). La fuente externa de SMT es
[SMT_SJ_Guia.txt](./SMT_SJ_Guia.txt); debe analizarse y normalizarse, pero no
publicarse automáticamente sin resolver procedencia, licencia y atribución.

---

## 2. Estado de Git al crear este contexto

La rama es `main`, alineada con `origin/main`, pero hay cambios locales sin
commit. **No crear un commit automáticamente salvo que el usuario lo pida.**

Cambios actuales:

- `README.md`
- `builder/builder.js`
- `builder/index.html`
- `schema/guide.schema.json`
- `service-worker.js`
- `src/modules/index.js`
- `src/validation.js`
- `src/viewer.js`
- `.github/workflows/ci.yml` (archivo nuevo)
- `tools/test-validation.mjs` (archivo nuevo)

El usuario pide que cada entrega incluya:

- `Commit summary`
- `Commit description`
- Indicación explícita de si se creó un commit real.

---

## 3. Trabajo completamente realizado

### Fase 1 — Base de datos y contrato

- Guías almacenadas como JSON independiente en `guides/`.
- Schema inicial en [schema/guide.schema.json](./schema/guide.schema.json).
- Metadatos principales: `id`, `title`, `franchise`, `systems`, `genres`,
  `tags`, `author`, `version`, `status`, `summary`, `keywords`.
- `quickIndex`, `tableOfContents`, secciones, pasos, imágenes, callouts,
  colecciones, entidades y tablas.
- Campo genérico `sources` para procedencia:
  - `id`
  - `title`
  - `license`
  - `url`
  - `attribution`
- Tipos de módulos registrados:
  - `grid_map`
  - `pin_map`
  - `decision_tree`
  - `timeline_route`
  - `interactive_tool`

### Fase 2 — Frontend base

- Hub en [index.html](./index.html) y [src/hub.js](./src/hub.js).
- Viewer en [viewer.html](./viewer.html).
- Builder en [builder/index.html](./builder/index.html).
- Estilos responsive y tema claro/oscuro en `src/styles.css`.
- Separación declarada entre Viewer y Builder en
  [src/app-manifest.json](./src/app-manifest.json).
- Arquitectura sin dependencias pesadas ni build system.

### Fase 3 — Viewer y core

- Carga de catálogo y guías.
- Índice rápido y tabla de contenidos jerárquica.
- Renderizado de pasos, callouts e imágenes antes/después.
- Markdown ligero y resaltado seguro de keywords.
- Progreso de pasos persistido en `localStorage`.
- Renderizado de los cinco módulos registrados.
- Renderizado de colecciones y filtros.
- Panel de fuentes y atribuciones al final del Viewer.
- URLs de fuentes limitadas a `http` y `https`.

### Fase 4 — Hub y PWA

- Catálogo con búsqueda y vistas grid/list.
- `manifest.json`.
- `service-worker.js` con caché `guidekit-shell-v9`.
- La shell, el catálogo y la guía piloto se precargan.
- Se verificó en navegador:
  - Service Worker registrado.
  - Caché `guidekit-shell-v9`.
  - Catálogo cacheado.
  - Guía piloto cacheada.

### Fase 5 — Builder

- Importación de JSON.
- Edición de metadatos, secciones, pasos, colecciones, índice rápido y fuentes.
- Exportación JSON.
- Descarga bloqueada cuando hay errores estructurales.
- Editor de `grid_map`:
  - ancho/alto
  - celdas clicables
  - estados `start`, `exit`, `poi`
- Editor de `pin_map`:
  - imagen
  - texto alternativo
  - pins con `label | kind | x | y`
  - coordenadas 0–100
- Editor de `decision_tree`:
  - nodos con `id | título | texto | siguiente, nodo`
  - referencias validadas
- Editor de `timeline_route`:
  - pasos con `id | título | texto | tipo`
  - orden textual preservado
- Editor de `interactive_tool`:
  - descripción
  - opciones `id | etiqueta | descripción`
- Editor de fuentes:
  - `id | título | licencia | URL | atribución`

### Fase 6 — Validación, pruebas y CI

- Validación compartida en [src/validation.js](./src/validation.js).
- CLI en [tools/validate-guide.mjs](./tools/validate-guide.mjs).
- Suite de regresión en [tools/test-validation.mjs](./tools/test-validation.mjs).
- Actualmente cubre **9 casos**:
  - guía piloto válida
  - coordenadas inválidas de `pin_map`
  - referencias inválidas de `decision_tree`
  - IDs duplicados de `timeline_route`
  - `interactive_tool` válido
  - IDs duplicados de opciones
  - fuente con licencia válida
  - licencia faltante
  - URL insegura
- CI en [.github/workflows/ci.yml](./.github/workflows/ci.yml):
  - push a `main`
  - pull request a `main`
  - Node.js 22
  - JSON
  - sintaxis JS
  - validación de guía
  - suite de regresión

---

## 4. Estado parcialmente hecho

### 4.1 Schema

El schema existe y es extensible, pero todavía es permisivo:

- `module` usa `additionalProperties: true`.
- `markers`, `legend` y algunos datos heredados no tienen contratos estrictos.
- Deben decidirse y documentarse mejor contratos por módulo.
- Falta validar automáticamente el JSON contra JSON Schema con una herramienta
  dedicada; la validación actual es una validación JavaScript propia.

Siguiente mejora recomendada:

1. No introducir una dependencia pesada.
2. Determinar si CI debe usar un validador JSON Schema externo.
3. Si se agrega dependencia, crear primero un manifest explícito y ajustar CI.

### 4.2 Builder visual

El Builder funciona, pero todavía es un editor textual/semivisual:

- `pin_map` todavía usa textarea; no permite colocar pins haciendo clic sobre una
  imagen subida.
- El tamaño de pins no se edita visualmente.
- No hay subida/selección de archivos de imagen integrada.
- No hay líneas, flechas o capas para mapas.
- `decision_tree` edita nodos por texto, no mediante un canvas visual.
- `timeline_route` edita pasos por texto.
- `interactive_tool` es una estructura genérica, no una herramienta ejecutable.
- Falta eliminar/reordenar módulos y elementos desde controles UX.
- Falta una estrategia de autosave o recuperación de borrador.

### 4.3 PWA

El Service Worker precarga la guía piloto, pero una futura guía debe añadirse al
array `SHELL` si se exige disponibilidad inmediata offline. Falta una estrategia
más escalable para descubrir y precargar múltiples guías sin hacer la caché
inmanejable.

También falta:

- probar instalación PWA en navegadores soportados
- estrategia de actualización visible al usuario
- manejo robusto de errores de `cache.addAll`
- documentar límites de almacenamiento

### 4.4 Viewer

Falta completar:

- galería/touch lightbox para imágenes
- navegación sincronizada texto-mapa
- filtros visuales de pins por categoría
- interacción real de opciones de `interactive_tool`
- presentación visual completa de nodos y conexiones
- accesibilidad más profunda: foco, teclado, contraste y anuncios ARIA
- pruebas automatizadas de renderizado

### 4.5 Guía de SMT

Solo existe una guía piloto reducida en
[guides/smt-strange-journey.json](./guides/smt-strange-journey.json).

No existe todavía la guía completa. La fuente tiene aproximadamente 21.978
líneas y contiene walkthroughs, tablas, mapas ASCII, enemigos y otros datos.
Antes de migrar:

1. Analizar bloques.
2. Separar contenido original, datos y anotaciones.
3. Revisar traducción y terminología.
4. Resolver licencia y atribución.
5. Normalizar por secciones y módulos.
6. Validar cada lote.
7. Revisar manualmente en Viewer.

---

## 5. Trabajo pendiente por fases

### Fase A — Calidad del contrato

- [ ] Crear contratos estrictos por módulo.
- [ ] Definir IDs y referencias de forma uniforme.
- [ ] Decidir política de `additionalProperties`.
- [ ] Añadir validación formal JSON Schema.
- [ ] Añadir ejemplos de cada módulo.
- [ ] Añadir fixture de una guía no-SMT para comprobar universalidad.

### Fase B — Builder profesional

- [ ] Editor visual de pins sobre imagen.
- [ ] Control intuitivo de tamaño de pins.
- [ ] Filtros y categorías de pins.
- [ ] Editor de capas/pisos para mapas.
- [ ] Editor visual de conexiones de árboles.
- [ ] Reordenamiento drag-and-drop de pasos.
- [ ] Eliminación y duplicación de módulos.
- [ ] Autosave local y recuperación de borradores.
- [ ] Mensajes UX y accesibilidad del Builder.

### Fase C — Viewer profesional

- [ ] Lightbox de imágenes.
- [ ] Filtros de mapas.
- [ ] Interacciones ejecutables de herramientas.
- [ ] Renderizado visual de conexiones.
- [ ] Navegación sincronizada entre índice, texto y módulos.
- [ ] Auditoría de accesibilidad.
- [ ] Pruebas de smoke del Viewer.

### Fase D — PWA y publicación

- [ ] Política escalable de caché de guías.
- [ ] Prueba offline después de recarga.
- [ ] Indicador de actualización de versión.
- [ ] GitHub Pages final.
- [ ] Licencia del repositorio.
- [ ] CONTRIBUTING.
- [ ] Política de atribución y contenido externo.

### Fase E — Migración de SMT

- [ ] Revisar derechos y procedencia de `SMT_SJ_Guia.txt`.
- [ ] Ejecutar `node tools/analyze-smt.mjs`.
- [ ] Ejecutar `node tools/extract-walkthrough.mjs`.
- [ ] Crear un mapa de correspondencia de bloques fuente a secciones JSON.
- [ ] Migrar primero walkthrough principal.
- [ ] Migrar tablas y entidades por lotes.
- [ ] Convertir mapas ASCII a `grid_map` o `pin_map` según corresponda.
- [ ] Revisar terminología inglesa y traducción española.
- [ ] Añadir fuentes/atribuciones apropiadas.
- [ ] Validar y revisar visualmente cada lote.
- [ ] No publicar automáticamente el archivo fuente completo.

---

## 6. Flujo obligatorio para la siguiente IA

1. Leer este archivo, `README.md` y `GuideKit_Engine.txt`.
2. Ejecutar `git status` y no descartar cambios locales.
3. Identificar una sola tarea concreta del bloque pendiente.
4. Buscar el patrón existente antes de crear lógica nueva.
5. Editar de forma quirúrgica y mantener separación Viewer/Builder.
6. Actualizar schema, validación, documentación y CI cuando aplique.
7. Ejecutar como mínimo:

   ```bash
   node tools/test-validation.mjs
   node tools/validate-guide.mjs guides/smt-strange-journey.json
   ```

8. Ejecutar `node --check` sobre los JS tocados.
9. Usar Problems del workspace.
10. Si el cambio afecta UI, probarlo en navegador con servidor local:

   ```bash
   python3 -m http.server 8080
   ```

11. Informar en la respuesta:
    - qué cambió
    - archivos modificados
    - validaciones
    - commit summary
    - commit description
    - si hubo commit real

No avanzar a la migración completa de SMT hasta que el contrato, procedencia,
pruebas y flujo de revisión estén suficientemente claros.

---

## 7. Riesgos y decisiones que no deben perderse

- No acoplar nuevas funciones a SMT.
- No publicar automáticamente texto externo de `SMT_SJ_Guia.txt`.
- No afirmar que la guía completa de SMT existe: solo hay un piloto.
- No mezclar UX del Viewer con UX del Builder.
- No usar `as any` ni atajos que oculten errores.
- No bloquear la aplicación con dependencias innecesarias.
- No crear commits sin solicitud explícita.
- Mantener las URLs externas seguras y las atribuciones visibles.
- Cada nueva guía offline debe considerarse en el Service Worker o en una
  estrategia futura de precarga.

## Próximo trabajo recomendado

La siguiente tarea más valiosa es **mejorar el editor visual de `pin_map`**:
permitir cargar una imagen local, hacer clic sobre ella para colocar pins,
editar categoría/tamaño y exportar coordenadas normalizadas. Después deben
añadirse tests de esos límites y una prueba real del Viewer.

