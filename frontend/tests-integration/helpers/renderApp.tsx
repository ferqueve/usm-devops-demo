import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

interface RenderOptions {
  initialEntries?: string[];
  // Mapa "ruta → componente" — los tests declaran las rutas que les importan
  // y opcionalmente un placeholder para destinos de redirect (ej: /dashboard).
  routes: { path: string; element: ReactElement }[];
}

export function renderApp({ initialEntries = ['/'], routes }: RenderOptions) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </MemoryRouter>
      <Toaster />
    </AuthProvider>
  );
}
