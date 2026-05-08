import { http, HttpResponse } from 'msw';

const API = 'http://localhost:8080/api/v1';

export const recomendacionesHandlers = [
  http.get(`${API}/recomendaciones/reservas/espacios`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/reservas/horarios`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/reservas/espacios-similares`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/inventario/mantenimiento`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/inventario/espacios-atencion`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/inventario/reasignaciones`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/inventario/compras`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/items/para-reserva`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/items/combinaciones`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/analistas/asignacion`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/analistas/prioritarias`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),
  http.get(`${API}/recomendaciones/dashboard`, () =>
    HttpResponse.json({
      success: true,
      data: { espacios: [], inventario: [], items: [], analistas: [] },
    })
  ),
];
