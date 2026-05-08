import { http, HttpResponse } from 'msw';

const API = 'http://localhost:8080/api/v1';

// Handlers misceláneos para endpoints chicos: carreras, stats globales,
// preferencias. Mantienen las pantallas que dependen de ellos sin
// "unhandled request" ruidosos.

export const miscHandlers = [
  http.get(`${API}/carreras`, () =>
    HttpResponse.json({
      success: true,
      data: [{ id: 1, nombre: 'Ingeniería en Sistemas' }],
    })
  ),
  http.post(`${API}/carreras`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 99, ...body } });
  }),
  http.get(`${API}/stats/active-users`, () =>
    HttpResponse.json({
      success: true,
      data: { total: 10, activos: 8, inactivos: 2 },
    })
  ),
  http.get(`${API}/preferences`, () =>
    HttpResponse.json({ success: true, data: { theme: 'system', locale: 'es' } })
  ),
  http.put(`${API}/preferences`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: body });
  }),
];
