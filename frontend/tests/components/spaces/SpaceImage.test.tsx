import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/spaces/Panorama360Viewer', () => ({
  default: () => <div data-testid="panorama" />,
}));

import { SpaceImage } from '@/components/spaces/SpaceImage';

const ORIGINAL = 'https://bucket/espacios/1/foto.jpg';
const THUMB = 'https://bucket/espacios/1/foto-thumb.jpg';

describe('SpaceImage', () => {
  // El recuadro mide poco más de 400 px y el original son 4096 px y dos megas.
  it('muestra la miniatura, no el original', () => {
    render(<SpaceImage src={ORIGINAL} thumbSrc={THUMB} alt="Aula 8" />);

    expect(screen.getByAltText('Aula 8')).toHaveAttribute('src', THUMB);
  });

  it('sin miniatura cae al original', () => {
    render(<SpaceImage src={ORIGINAL} alt="Aula 8" />);

    expect(screen.getByAltText('Aula 8')).toHaveAttribute('src', ORIGINAL);
  });
});
