import { http, HttpResponse } from 'msw';
import { makeInventoryItem } from '../factories';

const API = 'http://localhost:8080/api/v1';

const baseFields = (id: number, tipoNombre: string) => ({
  id,
  espacioId: 1,
  espacioNombre: 'Sala 101',
  tipoElementoId: 1,
  tipoElementoNombre: tipoNombre,
  cantidad: 1,
  estado: 'DISPONIBLE' as const,
  observaciones: '',
  activo: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const defaultItems = [
  { ...baseFields(201, 'Proyector'), ...makeInventoryItem({ id: 201, nombre: 'Proyector Epson' }) },
  { ...baseFields(202, 'Notebook'), ...makeInventoryItem({ id: 202, nombre: 'Notebook Dell' }) },
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

export const inventoryHandlers = [
  http.get(`${API}/inventario`, () =>
    HttpResponse.json({ success: true, data: defaultItems })
  ),
  http.get(`${API}/inventario/paged`, () =>
    HttpResponse.json({ success: true, data: pagedEnvelope(defaultItems) })
  ),
  http.get(`${API}/inventario/filter`, () =>
    HttpResponse.json({ success: true, data: defaultItems })
  ),
  http.get(`${API}/inventario/stats`, () =>
    HttpResponse.json({
      success: true,
      data: {
        totalItems: 2,
        totalCantidad: 2,
        disponibles: 2,
        mantenimiento: 0,
        danados: 0,
        sinAsignar: 0,
        asignados: 2,
        itemsInactivos: 0,
        porcentajeDisponibles: 100,
        porcentajeMantenimiento: 0,
        porcentajeDanados: 0,
        porcentajeSinAsignar: 0,
        porcentajeAsignados: 100,
        porcentajeInactivos: 0,
      },
    })
  ),
  http.get(`${API}/inventario/espacio/:espacioId`, () =>
    HttpResponse.json({ success: true, data: defaultItems })
  ),
  http.post(`${API}/inventario`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: makeInventoryItem({ ...body, id: 999 } as Partial<ReturnType<typeof makeInventoryItem>>),
    });
  }),
  http.put(`${API}/inventario/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...defaultItems[0], ...body, id: Number(params.id) },
    });
  }),
  http.delete(`${API}/inventario/:id`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get(`${API}/tipos-elemento`, () =>
    HttpResponse.json({
      success: true,
      data: [
        { id: 1, nombre: 'Proyector' },
        { id: 2, nombre: 'Notebook' },
      ],
    })
  ),
  http.post(`${API}/tipos-elemento`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 3, ...body } });
  }),
  http.put(`${API}/tipos-elemento/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: Number(params.id), ...body } });
  }),
  http.delete(`${API}/tipos-elemento/:id`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get(`${API}/stats/inventario/detailed`, () =>
    HttpResponse.json({
      success: true,
      data: {
        totalItems: 2,
        totalCantidad: 2,
        disponibles: 2,
        mantenimiento: 0,
        danados: 0,
        sinAsignar: 0,
        asignados: 2,
        itemsInactivos: 0,
        porcentajeDisponibles: 100,
        porcentajeMantenimiento: 0,
        porcentajeDanados: 0,
        porcentajeSinAsignar: 0,
        porcentajeAsignados: 100,
        porcentajeInactivos: 0,
      },
    })
  ),
];
