import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import AuthPage from '@/app/auth/page';
import { renderApp } from '../helpers/renderApp';
import { server } from '../msw/server';

const routes = [{ path: '/auth/register', element: <AuthPage /> }];

const API = 'http://localhost:8080/api/v1';

async function fillRegisterForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/^nombre$/i), 'Ana');
  await user.type(screen.getByLabelText(/^apellido$/i), 'Pérez');
  await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@utec.edu.uy');
  await user.type(screen.getByLabelText('Contraseña'), 'password123');
  await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
  // Aceptar términos y política — son checkboxes con label clickeable
  const checkboxes = screen.getAllByRole('checkbox');
  for (const cb of checkboxes) {
    await user.click(cb);
  }
}

describe('Register flow', () => {
  it('registro exitoso muestra mensaje de verificación de email', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/auth/register'], routes });

    await fillRegisterForm(user);
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText(/registro exitoso/i)).toBeInTheDocument();
    expect(
      screen.getByText(/enlace de verificación a tu correo/i)
    ).toBeInTheDocument();
  });

  it('registro con email duplicado muestra error del backend', async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json(
          { success: false, message: 'El email ya está registrado' },
          { status: 409 }
        )
      )
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ['/auth/register'], routes });

    await fillRegisterForm(user);
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/el email ya está registrado/i)
    ).toBeInTheDocument();
  });
});
