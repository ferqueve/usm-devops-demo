/**
 * Mide el contraste de todo lo que se ve en /ui, en los dos temas.
 *
 * No busca clases: abre la página, lee el color que el navegador resolvió
 * para cada texto y el fondo real que tiene debajo —apilando las capas
 * translúcidas— y calcula el ratio WCAG. Una clase puede estar bien escrita
 * y aun así fallar por el fondo que le tocó.
 *
 *   node scripts/contraste.mjs            # sólo lo que falla
 *   node scripts/contraste.mjs --todo     # también lo que pasa raspando
 *
 * Referencias: 4,5:1 para texto normal y 3:1 para texto grande (24 px, o
 * 18,66 px en negrita).
 *
 * Necesita el servidor de desarrollo levantado en :5173.
 */
import { chromium } from '@playwright/test';

const URL = process.env.UI_URL ?? 'http://localhost:5173/ui';
const TODO = process.argv.includes('--todo');

/** Lo que el navegador no puede medir solo: texto sobre un dibujo. */
const EXCEPCIONES = [
  // El catálogo de la paleta escribe el nombre y el hex encima de la muestra.
  // Ahí el bajo contraste es el dato: muestra cómo se comporta ese color.
  'muestra-de-color',
];

const medir = () => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();

  /** Resuelve cualquier color CSS —oklch, color(), hsl— a rgb. */
  const rgb = (s) => {
    if (cache.has(s)) return cache.get(s);
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = '#000';
    cx.fillStyle = s;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const v = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    cache.set(s, v);
    return v;
  };

  const lum = (c) => {
    const f = (x) => {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };

  const sobre = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  });

  /**
   * En SVG no hay `background-color`: lo que hay debajo de un texto es un
   * `<rect>` hermano. Sin esto, cada etiqueta de un mapa de árbol se medía
   * contra el blanco del documento y salía 1:1.
   */
  const fondoSvg = (el) => {
    for (let e = el; e && e.ownerSVGElement; e = e.parentElement) {
      for (let h = e.previousElementSibling; h; h = h.previousElementSibling) {
        if (h.tagName === 'rect' || h.tagName === 'path' || h.tagName === 'circle') {
          const f = getComputedStyle(h).fill;
          if (f && f !== 'none') {
            const c = rgb(f);
            if (c.a > 0.5) return c;
          }
        }
      }
    }
    return null;
  };

  /** El fondo real: apila las capas translúcidas hasta la primera opaca. */
  const fondoDe = (el) => {
    const capas = [];
    for (let e = el; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c.a > 0) {
        capas.push(c);
        if (c.a >= 0.999) break;
      }
    }
    if (capas.length === 0) return { r: 255, g: 255, b: 255, a: 1 };
    let acc = capas.pop();
    while (capas.length) acc = sobre(capas.pop(), acc);
    return acc;
  };

  const ratio = (a, b) => {
    const x = lum(a);
    const y = lum(b);
    const [alto, bajo] = x > y ? [x, y] : [y, x];
    return (alto + 0.05) / (bajo + 0.05);
  };

  const filas = [];
  for (const el of document.querySelectorAll('*')) {
    if (el.children.length > 0) continue;
    const texto = el.textContent?.trim();
    if (!texto) continue;
    const caja = el.getBoundingClientRect();
    if (caja.width < 2 || caja.height < 2) continue;

    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || Number(st.opacity) === 0) continue;

    // En SVG el texto lo pinta `fill`, no `color`: medir `color` daba el
    // valor heredado de la tarjeta y todas las etiquetas de eje salían mal.
    const enSvg = el.ownerSVGElement != null;
    const fondo = enSvg ? (fondoSvg(el) ?? fondoDe(el)) : fondoDe(el);
    const declarado = enSvg ? st.fill : st.color;
    if (enSvg && (declarado === 'none' || !declarado)) continue;
    const crudo = rgb(declarado);
    const tinta = crudo.a < 1 ? sobre(crudo, fondo) : crudo;

    const px = parseFloat(st.fontSize);
    const grande = px >= 24 || (px >= 18.66 && parseInt(st.fontWeight, 10) >= 700);
    const minimo = grande ? 3 : 4.5;

    filas.push({
      texto: texto.slice(0, 40),
      ratio: Math.round(ratio(tinta, fondo) * 100) / 100,
      minimo,
      px,
      oscuro: Boolean(el.closest('.dark')),
      clase: String(el.className?.baseVal ?? el.className ?? el.parentElement?.className ?? '').slice(0, 70),
      marca: el.closest('[data-contraste]')?.dataset.contraste ?? null,
    });
  }
  return filas;
};

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 2560, height: 1440 } });

try {
  await pagina.goto(URL, { waitUntil: 'networkidle', timeout: 30_000 });
} catch {
  console.error(`No se pudo abrir ${URL}. ¿Está levantado el servidor de desarrollo?`);
  await navegador.close();
  process.exit(1);
}
await pagina.waitForTimeout(1500);

const filas = (await pagina.evaluate(medir)).filter((f) => !EXCEPCIONES.includes(f.marca));
await navegador.close();

const fallan = filas.filter((f) => f.ratio < f.minimo);
const justo = filas.filter((f) => f.ratio >= f.minimo && f.ratio < f.minimo + 0.5);

/** Agrupa por clase y ratio: veinte badges iguales son un solo problema. */
const agrupar = (lista) => {
  const mapa = new Map();
  for (const f of lista) {
    const k = `${f.clase}|${f.ratio}|${f.oscuro}`;
    if (!mapa.has(k)) mapa.set(k, { ...f, veces: 0, ejemplos: [] });
    const g = mapa.get(k);
    g.veces += 1;
    if (g.ejemplos.length < 3) g.ejemplos.push(f.texto);
  }
  return [...mapa.values()].sort((a, b) => a.ratio - b.ratio);
};

const imprimir = (titulo, grupos) => {
  if (grupos.length === 0) return;
  console.log(`\n${titulo}`);
  for (const g of grupos) {
    const tema = g.oscuro ? 'oscuro' : 'claro ';
    const veces = g.veces > 1 ? ` ×${g.veces}` : '';
    console.log(
      `  ${String(g.ratio).padStart(5)} / ${g.minimo}  ${tema}  ${String(Math.round(g.px)).padStart(2)}px${veces}  ${g.ejemplos.join(' · ')}`
    );
    console.log(`         ${g.clase}`);
  }
};

console.log(`${filas.length} textos medidos en ${URL}`);
console.log(`${fallan.length} por debajo del mínimo · ${justo.length} pasando raspando`);
imprimir('No llegan al mínimo:', agrupar(fallan));
if (TODO) imprimir('Pasan por menos de 0,5:', agrupar(justo));

process.exit(fallan.length > 0 ? 1 : 0);
