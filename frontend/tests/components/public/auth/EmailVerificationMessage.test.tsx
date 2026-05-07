import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailVerificationMessage } from '@/components/public/auth/EmailVerificationMessage';

describe('EmailVerificationMessage', () => {
  it('llama a onBackToLogin al hacer click en el botón', async () => {
    const onBackToLogin = vi.fn();
    render(<EmailVerificationMessage onBackToLogin={onBackToLogin} />);
    await userEvent.click(screen.getByRole('button', { name: 'Volver al Login' }));
    expect(onBackToLogin).toHaveBeenCalled();
  });

  it('llama a onResendEmail cuando no hay cooldown', async () => {
    const onResendEmail = vi.fn();
    render(<EmailVerificationMessage onResendEmail={onResendEmail} />);
    await userEvent.click(screen.getByRole('button', { name: 'reenvía el enlace' }));
    expect(onResendEmail).toHaveBeenCalled();
  });

  it('muestra el cooldown y deshabilita el botón de reenvío', () => {
    render(<EmailVerificationMessage resendCooldown={30} />);
    const btn = screen.getByRole('button', { name: /reenvía el enlace \(30s\)/ });
    expect(btn).toBeDisabled();
  });
});
