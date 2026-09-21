/**
 * Qué archivo de `src/` no importa nadie.
 *
 * Distingue tres casos, porque no significan lo mismo:
 *
 *   - **Sólo el catálogo /ui**: el componente existe, se ve en `/ui`, y
 *     ninguna pantalla lo usa. Es lo más engañoso: parece vivo porque se
 *     puede mirar.
 *   - **Sólo los tests**: el módulo y su test se sostienen mutuamente.
 *   - **Nadie**: ni siquiera eso.
 *
 *   node scripts/muerto.mjs
 *
 * Un barrel muerto esconde a sus hijos, así que después de borrar conviene
 * volver a correrlo: aparecen los que quedaron huérfanos.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const RAIZ = resolve('src');
const TESTS = resolve('tests');

/** Los que arrancan la aplicación: nadie los importa y está bien. */
const ENTRADAS = ['main.tsx', 'App.tsx'];

function recorrer(dir, acc = []) {
  let entradas;
  try {
    entradas = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entradas) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) recorrer(p, acc);
    else if (/\.tsx?$/.test(p) && !/\.d\.ts$/.test(p)) acc.push(p);
  }
  return acc;
}

const archivos = recorrer(RAIZ);
const pruebas = recorrer(TESTS);

/** Resuelve un specifier a un archivo real. `@/` apunta a `src/`. */
function resolver(desde, spec) {
  let base;
  if (spec.startsWith('@/')) base = join(RAIZ, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(desde), spec);
  else return null; // paquete de node_modules
  for (const sufijo of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
    const candidato = base + sufijo;
    if (archivos.includes(candidato)) return candidato;
  }
  return null;
}

const importadoPor = new Map(archivos.map((a) => [a, new Set()]));
const IMPORTS = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;

for (const f of [...archivos, ...pruebas]) {
  for (const m of readFileSync(f, 'utf8').matchAll(IMPORTS)) {
    const destino = resolver(f, m[1]);
    if (destino && destino !== f) importadoPor.get(destino).add(f);
  }
}

const esCatalogo = (p) => p.startsWith(join(RAIZ, 'app', 'ui'));
const esTest = (p) => p.startsWith(TESTS);

const grupos = { catalogo: [], tests: [], nadie: [] };

for (const [archivo, quienes] of importadoPor) {
  if (ENTRADAS.some((e) => archivo.endsWith(`/${e}`))) continue;
  if (esCatalogo(archivo)) continue;

  const deVerdad = [...quienes].filter((q) => !esCatalogo(q) && !esTest(q));
  if (deVerdad.length > 0) continue;

  const corto = relative(process.cwd(), archivo);
  if ([...quienes].some(esCatalogo)) grupos.catalogo.push(corto);
  else if ([...quienes].some(esTest)) grupos.tests.push(corto);
  else grupos.nadie.push(corto);
}

const listar = (titulo, xs) => {
  if (xs.length === 0) return;
  console.log(`\n${titulo} (${xs.length})`);
  for (const x of xs.sort()) console.log(`  ${x}`);
};

const total = grupos.catalogo.length + grupos.tests.length + grupos.nadie.length;
console.log(`${archivos.length} archivos en src/ · ${total} sin uso real`);
listar('Sólo lo usa el catálogo /ui', grupos.catalogo);
listar('Sólo lo usan los tests', grupos.tests);
listar('No lo importa nadie', grupos.nadie);
if (total === 0) console.log('\nNada muerto.');

process.exit(total > 0 ? 1 : 0);
