import { http, HttpResponse } from 'msw';
import { makeLoginResponse } from '../factories';

const API = 'http://localhost:8080/api/v1';

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password === 'wrong-password') {
      return HttpResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: makeLoginResponse({ email: body.email, rol: 'ADMIN' }),
    });
  }),

  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; nombre: string; apellido: string };
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Registro exitoso. Verificá tu email.',
        usuario: {
          id: 1,
          nombre: body.nombre,
          apellido: body.apellido,
          email: body.email,
          rol: 'ESTUDIANTE',
        },
      },
    });
  }),

  http.post(`${API}/auth/logout`, () =>
    HttpResponse.json({ success: true, data: 'Sesión cerrada' })
  ),

  http.get(`${API}/auth/verify`, () =>
    HttpResponse.json({ success: true, data: true })
  ),

  http.post(`${API}/auth/verify-email`, () =>
    HttpResponse.json({ success: true, data: 'Email verificado' })
  ),

  http.post(`${API}/auth/forgot-password`, () =>
    HttpResponse.json({ success: true, data: 'Email enviado' })
  ),

  http.post(`${API}/auth/reset-password`, () =>
    HttpResponse.json({ success: true, data: 'Contraseña restablecida' })
  ),
];
