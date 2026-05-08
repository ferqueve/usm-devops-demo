import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import { renderApp } from '../helpers/renderApp';

const authStub = <div data-testid="auth-stub">Auth</div>;

const routes = [
  { path: '/auth/reset-password', element: <ResetPasswordPage /> },
  { path: '/auth', element: authStub },
];

describe('Reset password flow', () => {
  it('cambiar password con token válido muestra confirmación y redirige a /auth', async () => {
    const user = userEvent.setup();
    renderApp({
      initialEntries: ['/auth/reset-password?token=valid-token-123'],
      routes,
    });

    await user.type(
      await screen.findByLabelText(/nueva contraseña/i),
      'newpass123'
    );
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

    expect(
      await screen.findByText(/contraseña restablecida exitosamente/i)
    ).toBeInTheDocument();
    expect(await screen.findByTestId('auth-stub', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('sin token muestra estado de token inválido', async () => {
    renderApp({ initialEntries: ['/auth/reset-password'], routes });

    expect(await screen.findByText(/token inválido/i)).toBeInTheDocument();
  });
});
