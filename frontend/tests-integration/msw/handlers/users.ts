import { http, HttpResponse } from 'msw';

const API = 'http://localhost:8080/api/v1';

interface FullUser {
  id: number;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'ANALISTA' | 'ESTUDIANTE' | 'DOCENTE' | 'ENCARGADO' | 'EXTERNO' | 'MANTENIMIENTO';
  rolApp: FullUser['rol'];
  verificado: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

const make = (overrides: Partial<FullUser>): FullUser => ({
  id: 11,
  email: 'admin@utec.edu.uy',
  nombre: 'Admin',
  rol: 'ADMIN',
  rolApp: 'ADMIN',
  verificado: true,
  activo: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const defaultUsers: FullUser[] = [
  make({ id: 11, email: 'admin@utec.edu.uy', nombre: 'Admin', rol: 'ADMIN', rolApp: 'ADMIN' }),
  make({
    id: 12,
    email: 'estudiante@utec.edu.uy',
    nombre: 'Estu Diante',
    rol: 'ESTUDIANTE',
    rolApp: 'ESTUDIANTE',
  }),
];

const pagedEnvelope = <T>(content: T[]) => ({
  content,
  page: 0,
  size: content.length,
  totalElements: content.length,
  totalPages: 1,
  first: true,
  last: true,
  hasNext: false,
  hasPrevious: false,
  numberOfElements: content.length,
});

export const usersHandlers = [
  http.get(`${API}/usuarios`, () =>
    HttpResponse.json({ success: true, data: pagedEnvelope(defaultUsers) })
  ),
  http.get(`${API}/usuarios/stats`, () =>
    HttpResponse.json({
      success: true,
      data: {
        totalUsuarios: 2,
        totalActivos: 2,
        totalInactivos: 0,
        totalVerificados: 2,
        totalNoVerificados: 0,
        usuariosPorRol: { ADMIN: 1, ESTUDIANTE: 1 },
        usuariosPorProveedor: { local: 2 },
      },
    })
  ),
  http.get(`${API}/usuarios/analistas`, () =>
    HttpResponse.json({ success: true, data: [defaultUsers[0]] })
  ),
  http.get(`${API}/usuarios/me`, () =>
    HttpResponse.json({ success: true, data: defaultUsers[0] })
  ),
  http.put(`${API}/usuarios/me`, async ({ request }) => {
    const body = (await request.json()) as Partial<FullUser>;
    return HttpResponse.json({ success: true, data: { ...defaultUsers[0], ...body } });
  }),
  http.put(`${API}/usuarios/:userId/rol`, async ({ params, request }) => {
    const body = (await request.json()) as { rolApp?: FullUser['rol']; rol?: FullUser['rol'] };
    const user = defaultUsers.find((u) => u.id === Number(params.userId)) ?? defaultUsers[0];
    const rol = body.rolApp ?? body.rol ?? user.rol;
    return HttpResponse.json({ success: true, data: { ...user, rol, rolApp: rol } });
  }),
  http.put(`${API}/usuarios/:userId/toggle-activo`, ({ params }) => {
    const user = defaultUsers.find((u) => u.id === Number(params.userId)) ?? defaultUsers[0];
    return HttpResponse.json({ success: true, data: { ...user, activo: !user.activo } });
  }),
  http.put(`${API}/usuarios/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<FullUser>;
    return HttpResponse.json({
      success: true,
      data: { ...defaultUsers[0], ...body, id: Number(params.id) },
    });
  }),
  http.post(`${API}/usuarios/:userId/resend-verification`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.post(`${API}/usuarios/:userId/reset-password`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
];
