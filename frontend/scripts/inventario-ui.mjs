#!/usr/bin/env node
/**
 * Genera el inventario de componentes que muestra la página /ui.
 *
 * La cobertura no se anota a mano: el script lee qué importa el catálogo y
 * marca esos componentes como cubiertos. Así no puede mentir — si alguien
 * agrega una pantalla nueva y no la pone en /ui, aparece como pendiente sola.
 *
 *   node scripts/inventario-ui.mjs
 *
 * Se ejecuta a mano cuando se agregan componentes. La salida
 * (src/app/ui/_inventario.json) se commitea para que la página no tenga que
 * leer el disco en runtime.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = new URL('../src', import.meta.url).pathname;
const CATALOGO = join(RAIZ, 'app', 'ui');

/** Todos los .tsx del proyecto, menos los del propio catálogo. */
function archivos(dir, acc = []) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      if (entrada !== 'node_modules') archivos(ruta, acc);
    } else if (entrada.endsWith('.tsx')) {
      acc.push(ruta);
    }
  }
  return acc;
}

/**
 * Por qué un componente puede no estar en el catálogo.
 *
 * No todo tiene que estar: una pantalla completa no es una primitiva, y algo
 * que se monta pidiéndole datos al backend haría que el catálogo dependiera de
 * que el backend esté vivo. Lo que importa es que el motivo esté escrito y no
 * que la ausencia pase desapercibida.
 */
function clasificar(ruta, texto, nombres) {
  const rel = relative(RAIZ, ruta).split(sep).join('/');
  const base = rel.split('/').pop().replace('.tsx', '');

  if (rel.startsWith('app/')) return { tipo: 'pantalla', motivo: 'Es una ruta, no una primitiva.' };
  if (/Management$/.test(base)) return { tipo: 'pantalla', motivo: 'Pantalla de gestión completa.' };
  if (rel.startsWith('components/layouts/')) return { tipo: 'chrome', motivo: 'Arma la pantalla; se ve en cualquier ruta.' };
  if (rel.startsWith('components/auth/')) return { tipo: 'chrome', motivo: 'Guardas de ruta, sin interfaz propia.' };
  if (rel.startsWith('components/ui/') && !/log-viewer|http-trace|liquibase|metric|progress-ring|status-badge|avatar-initials|filter-bar|empty-state|backgrounds/.test(rel)) {
    return { tipo: 'shadcn', motivo: 'Primitiva de shadcn sin cambios propios.' };
  }
  const traeDatos = /use[A-Z]\w*Query|useEffect\s*\(|\bapi\.\w+|fetch\(|axios/.test(texto);
  if (traeDatos) return { tipo: 'datos', motivo: 'Pide datos al montarse.' };
  return { tipo: 'montable', motivo: '' };
}

const todos = archivos(RAIZ).filter((f) => !f.startsWith(CATALOGO));

/** Nombres que el catálogo importa: eso es «cubierto». */
const cubiertos = new Set();
for (const f of archivos(CATALOGO)) {
  const txt = readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/import\s+([A-Z]\w*)\s*,?\s*(?:\{[^}]*\})?\s*from\s+['"](@\/components[^'"]+)['"]/g)) {
    cubiertos.add(m[1]);
  }
  for (const m of txt.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    if (!m[2].startsWith('@/components')) continue;
    for (const n of m[1].split(',')) {
      const limpio = n.trim().split(/\s+as\s+/)[0].trim();
      if (/^[A-Z]/.test(limpio)) cubiertos.add(limpio);
    }
  }
}

const inventario = [];
for (const ruta of todos) {
  const texto = readFileSync(ruta, 'utf8');
  const rel = relative(RAIZ, ruta).split(sep).join('/');
  const nombres = new Set();
  for (const m of texto.matchAll(/export\s+(?:default\s+)?function\s+([A-Z]\w*)/g)) nombres.add(m[1]);
  for (const m of texto.matchAll(/export\s+const\s+([A-Z]\w*)\s*[:=]/g)) nombres.add(m[1]);
  // `export default X` y `export default memo(...)`: el nombre es el del archivo.
  if (/export\s+default\s+(?!function\s+[A-Z]|class)/.test(texto)) {
    nombres.add(rel.split('/').pop().replace('.tsx', ''));
  }
  if (nombres.size === 0) continue;

  const { tipo, motivo } = clasificar(ruta, texto, nombres);
  const lista = [...nombres].sort();

  inventario.push({
    archivo: rel,
    familia: rel.startsWith('components/') ? rel.split('/')[1] : rel.split('/')[0],
    nombres: lista,
    lineas: texto.split('\n').length,
    dialog: /(Dialog|Sheet|Drawer)Content/.test(texto),
    tipo,
    motivo,
    cubierto: lista.some((n) => cubiertos.has(n)),
  });
}

inventario.sort((a, b) => a.archivo.localeCompare(b.archivo));

const total = inventario.length;
const montables = inventario.filter((c) => c.tipo === 'montable');
const hechos = montables.filter((c) => c.cubierto).length;

writeFileSync(
  join(CATALOGO, '_inventario.json'),
  JSON.stringify({ generado: new Date().toISOString().slice(0, 10), inventario }, null, 1) + '\n'
);

console.log(`${total} archivos con componente exportado`);
console.log(`${montables.length} montables · ${hechos} en el catálogo · ${montables.length - hechos} pendientes`);
console.log(`${inventario.filter((c) => c.dialog).length} con diálogo`);
for (const t of ['pantalla', 'datos', 'shadcn', 'chrome']) {
  console.log(`  ${inventario.filter((c) => c.tipo === t).length} ${t}`);
}
