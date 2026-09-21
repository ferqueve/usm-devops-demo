import { describe, it, expect } from 'vitest';
import { HEADER_PRIMARY } from '@/components/layouts/PageHeader';

// La barra de arriba es `chrome`, oscura en los dos temas. El botón primario
// que va encima tiene que ser blanco fijo: `bg-card` sigue al tema y en
// oscuro lo volvía gris sobre gris, invisible. Pasó dos veces, la segunda con
// un comentario al lado que lo advertía.
describe('HEADER_PRIMARY', () => {
  it('va en blanco fijo, no en una superficie que sigue al tema', () => {
    expect(HEADER_PRIMARY).toMatch(/\bbg-white\b/);
    expect(HEADER_PRIMARY).not.toMatch(/\bbg-(card|background|muted|secondary|accent)\b/);
  });
});
