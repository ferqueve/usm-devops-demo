import { http, HttpResponse } from 'msw';

const API = 'http://localhost:8080/api/v1';

const defaultAudit = [
  {
    id: 1,
    entidad: 'Reserva',
    entidadId: 100,
    accion: 'CREATE' as const,
    usuarioId: 1,
    usuarioNombre: 'Admin',
    usuarioEmail: 'admin@utec.edu.uy',
    timestamp: '2026-05-01T10:00:00Z',
    datosPrevios: null,
    datosNuevos: JSON.stringify({ id: 100, estado: 'PENDIENTE' }),
  },
  {
    id: 2,
    entidad: 'Espacio',
    entidadId: 101,
    accion: 'UPDATE' as const,
    usuarioId: 1,
    usuarioNombre: 'Admin',
    usuarioEmail: 'admin@utec.edu.uy',
    timestamp: '2026-05-02T11:00:00Z',
    datosPrevios: JSON.stringify({ capacidad: 20 }),
    datosNuevos: JSON.stringify({ capacidad: 30 }),
  },
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

export const auditHandlers = [
  http.get(`${API}/audit`, ({ request }) => {
    const url = new URL(request.url);
    const entidad = url.searchParams.get('entidad');
    const filtered = entidad
      ? defaultAudit.filter((a) => a.entidad === entidad)
      : defaultAudit;
    return HttpResponse.json({ success: true, data: pagedEnvelope(filtered) });
  }),
  http.get(`${API}/audit/:id`, ({ params }) => {
    const id = Number(params.id);
    const log = defaultAudit.find((a) => a.id === id) ?? defaultAudit[0];
    return HttpResponse.json({ success: true, data: { ...log, id } });
  }),
];
