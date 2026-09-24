# GuideKit Engine

GuideKit Engine es un visor y kit de autoría para guías interactivas de videojuegos,
orientado a pantallas táctiles, dispositivos portátiles y escritorio. La primera
entrega usa tecnologías web nativas para mantener el proyecto ligero y publicable
directamente en GitHub Pages.

## Inicio local

Desde la raíz del proyecto:

```bash
python3 -m http.server 8080
```

Después abre <http://localhost:8080/>. El visor recibe la guía mediante
`viewer.html?guide=smt-strange-journey`.

## Estructura

- `guides/`: documentos JSON de guías y el catálogo estático.
- `schema/`: contrato JSON Schema para validar guías.
- `src/`: estilos, módulos de interfaz y lógica del visor.
- `src/modules/`: registro y renderizadores independientes por tipo de herramienta.
- `src/components/`: componentes transversales reutilizables por cualquier género.
- `builder/`: creador inicial sin dependencias para importar JSON, editar
  metadatos y secciones, añadir pasos y exportar una nueva guía.
- `assets/`: recursos gráficos y futuros iconos.
- `manifest.json` y `service-worker.js`: instalación y caché offline.
- `src/app-manifest.json`: separación explícita entre superficie de consumo
  (`viewer`) y superficie de creación (`builder`).
- `src/validation.js`: reglas compartidas por el Builder y las herramientas CLI.

## Contrato de datos

Las guías son documentos independientes. Los módulos visuales se modelan como
uniones discriminadas por `type`, de forma que añadir un módulo no obliga a
modificar las guías existentes. Las rutas de imágenes pueden ser locales o
absolutas HTTPS.

Los módulos representan herramientas visuales específicas (mapas, árboles o
timelines); los componentes representan capacidades transversales como progreso,
resaltado, imágenes y colecciones de datos. Ninguna de las dos capas depende de
SMT ni de un género concreto.

La aplicación tiene dos funciones deliberadamente distintas:

- **Viewer:** interfaz de consumo, optimizada para leer, saltar entre secciones
  y guardar progreso durante la partida.
- **Builder:** interfaz de autoría, optimizada para editar, validar y exportar
  documentos. No debe añadir requisitos a la experiencia del lector.

## Estado del proyecto

La base actual cubre el hub, el visor de pasos, índice rápido, tabla de
contenidos, resaltado de términos clave, checklist persistente y una primera
guía piloto reducida para validar el flujo. Los pasos admiten imágenes locales o
HTTPS mediante `images: [{ "src", "alt", "caption", "position" }]`. El contenido
completo de SMT se integrará después de cerrar el contrato y las reglas de
atribución del material.

Para inspeccionar la guía fuente antes de migrarla:

```bash
node tools/analyze-smt.mjs
node tools/extract-walkthrough.mjs > /tmp/smt-walkthrough-draft.json
node tools/validate-guide.mjs guides/smt-strange-journey.json
```

El extractor conserva anclas y líneas de origen, pero no publica automáticamente
el texto: cada sección debe revisarse, traducirse y normalizarse antes de entrar
en una guía distribuible.

La búsqueda de colecciones del viewer es deliberadamente genérica: inspecciona
el texto visible de cada fila o entidad, por lo que funciona igual para
enemigos, cartas, pistas, rutas, habilidades o coleccionables. El builder podrá
reutilizar el mismo componente para explorar y editar datos sin mezclar el flujo
de autoría con el de lectura.

El Builder no permite descargar una guía con errores estructurales. La validación
se ejecuta mientras se edita y marca IDs duplicados, referencias rotas, módulos
desconocidos, mapas incompletos y coordenadas inválidas.

El Builder también permite editar colecciones genéricas desde el navegador. Cada
entidad usa el formato `nombre | categoría | descripción`; la estructura final
se guarda en `datasets.collections` y puede representar contenido de cualquier
género.

El editor de `grid_map` permite crear mapas por cuadrícula desde el navegador.
El clic sobre una celda alterna entre vacío, inicio, salida y punto de interés;
las dimensiones y los marcadores se exportan como datos independientes del juego.
La validación también impide exportar marcadores fuera de los límites declarados.

El editor de `pin_map` permite definir una imagen base y marcadores mediante
coordenadas porcentuales (`0-100`). Esto mantiene el módulo reutilizable para
cualquier género y evita acoplarlo a un juego concreto.

El editor de `decision_tree` permite definir nodos y sus conexiones con el
formato `id | título | texto | siguiente, nodo`. Las referencias inexistentes
se consideran errores y bloquean la exportación.
