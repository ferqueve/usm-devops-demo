import { http, HttpResponse } from 'msw';
import { makeReserva } from '../factories';

const API = 'http://localhost:8080/api/v1';

const defaultReservas = [
  makeReserva({
    id: 301,
    espacioId: 101,
    espacioNombre: 'Sala 101',
    estado: 'PENDIENTE',
    motivo: 'Reunión',
  }),
  makeReserva({
    id: 302,
    espacioId: 102,
    espacioNombre: 'Auditorio A',
    estado: 'APROBADA',
    motivo: 'Charla',
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

export const reservationsHandlers = [
  http.get(`${API}/reservas/mis-reservas`, () =>
    HttpResponse.json({ success: true, data: defaultReservas })
  ),
  http.get(`${API}/reservas/mis-reservas/paged`, () =>
    HttpResponse.json({ success: true, data: pagedEnvelope(defaultReservas) })
  ),
  http.get(`${API}/reservas/mis-reservas/stats`, () =>
    HttpResponse.json({
      success: true,
      data: { total: 2, pendientes: 1, aprobadas: 1, canceladas: 0, rechazadas: 0 },
    })
  ),
  http.get(`${API}/reservas/todas`, () =>
    HttpResponse.json({ success: true, data: defaultReservas })
  ),
  http.get(`${API}/reservas/paged`, () =>
    HttpResponse.json({ success: true, data: pagedEnvelope(defaultReservas) })
  ),
  http.get(`${API}/reservas/espacio/:espacioId`, () =>
    HttpResponse.json({ success: true, data: defaultReservas })
  ),
  http.get(`${API}/reservas/:id`, ({ params }) => {
    const id = Number(params.id);
    const r = defaultReservas.find((x) => x.id === id) ?? defaultReservas[0];
    return HttpResponse.json({ success: true, data: { ...r, id } });
  }),
  http.post(`${API}/reservas`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: makeReserva({ ...body, id: 999 } as Partial<ReturnType<typeof makeReserva>>),
    });
  }),
  http.put(`${API}/reservas/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...defaultReservas[0], ...body, id: Number(params.id) },
    });
  }),
  http.patch(`${API}/reservas/:id/estado`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...defaultReservas[0], ...body, id: Number(params.id) },
    });
  }),
  http.delete(`${API}/reservas/:id`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get(`${API}/reservas/items-solicitados`, () =>
    HttpResponse.json({ success: true, data: pagedEnvelope([]) })
  ),
  http.patch(`${API}/reservas/items-solicitados/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { id: Number(params.id), ...body },
    });
  }),
];
