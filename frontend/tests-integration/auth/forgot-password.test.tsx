import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';
import { renderApp } from '../helpers/renderApp';

const routes = [{ path: '/auth/forgot-password', element: <ForgotPasswordPage /> }];

describe('Forgot password flow', () => {
  it('enviar email muestra mensaje de confirmación', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/auth/forgot-password'], routes });

    await user.type(
      await screen.findByLabelText(/correo electrónico/i),
      'usuario@utec.edu.uy'
    );
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }));

    expect(
      await screen.findByText(/recibirás un enlace para recuperar tu contraseña/i)
    ).toBeInTheDocument();
  });
});
