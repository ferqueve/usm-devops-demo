import { http, HttpResponse } from 'msw';
import { makeEspacio } from '../factories';

const API = 'http://localhost:8080/api/v1';

const fullEspacio = (id: number, nombre: string, capacidad: number) => ({
  ...makeEspacio({ id, nombre, capacidad }),
  tipoEspacioNombre: 'Aula',
  estado: 'DISPONIBLE' as const,
  activo: true,
  edificioId: 1,
  edificioNombre: 'Edificio Central',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const defaultEspacios = [
  fullEspacio(101, 'Sala 101', 30),
  fullEspacio(102, 'Auditorio A', 120),
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

export const spacesHandlers = [
  http.get(`${API}/espacios`, () =>
    HttpResponse.json({ success: true, data: defaultEspacios })
  ),
  http.get(`${API}/espacios/paged`, () =>
    HttpResponse.json({ success: true, data: pagedEnvelope(defaultEspacios) })
  ),
  http.get(`${API}/espacios/filter`, () =>
    HttpResponse.json({ success: true, data: defaultEspacios })
  ),
  http.get(`${API}/espacios/stats`, () =>
    HttpResponse.json({
      success: true,
      data: { total: 2, disponibles: 2, mantenimiento: 0, fueraServicio: 0 },
    })
  ),
  http.get(`${API}/espacios/:id`, ({ params }) => {
    const id = Number(params.id);
    const espacio = defaultEspacios.find((e) => e.id === id) ?? defaultEspacios[0];
    return HttpResponse.json({ success: true, data: { ...espacio, id } });
  }),
  http.post(`${API}/espacios`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: makeEspacio({ ...body, id: 999 } as Partial<ReturnType<typeof makeEspacio>>),
    });
  }),
  http.put(`${API}/espacios/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...defaultEspacios[0], ...body, id: Number(params.id) },
    });
  }),
  http.delete(`${API}/espacios/:id`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get(`${API}/espacios/:id/imagen`, () =>
    HttpResponse.json({ success: true, data: { imageUrl: null, objectName: null } })
  ),
  http.delete(`${API}/espacios/:id/imagen`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get(`${API}/tipos-espacio`, () =>
    HttpResponse.json({
      success: true,
      data: [
        { id: 1, nombre: 'Aula', activo: true },
        { id: 2, nombre: 'Auditorio', activo: true },
      ],
    })
  ),
  http.post(`${API}/tipos-espacio`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 3, ...body } });
  }),
  http.put(`${API}/tipos-espacio/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: Number(params.id), ...body } });
  }),
  http.delete(`${API}/tipos-espacio/:id`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get(`${API}/edificios`, () =>
    HttpResponse.json({
      success: true,
      data: [{ id: 1, nombre: 'Edificio Central' }],
    })
  ),
];
