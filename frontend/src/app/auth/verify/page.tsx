import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/core/api/api';
import { VerifyEmailForm } from '@/components/public/auth/VerifyEmailForm';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    // Verificar el token
    verifyEmailToken(token);
  }, [searchParams]);

  const verifyEmailToken = async (token: string) => {
    try {
      const response = await authApi.verifyEmail(token);
      
      if (response.success) {
        // Extraer email del token para mostrarlo en el éxito
        const extractedEmail = extractEmailFromToken(token);
        if (extractedEmail) {
          setEmail(extractedEmail);
        }
        
        setStatus('success');
        setMessage('¡Email verificado exitosamente! Ya puedes iniciar sesión.');
        
        // Redirigir al login después de 5 segundos
        setTimeout(() => {
          navigate('/auth');
        }, 5000);
      } else {
        // Si falla, intentar extraer email del token para reenvío
        const extractedEmail = extractEmailFromToken(token);
        if (extractedEmail) {
          setEmail(extractedEmail);
          setStatus('error');
          setMessage('El código de verificación ha expirado. Haz clic en "Reenviar" para obtener uno nuevo.');
        } else {
          setStatus('error');
          setMessage('Inválido');
          setEmail(''); // No mostrar email para reenvío
        }
      }
    } catch (error) {
      // Si falla, intentar extraer email del token para reenvío
      const extractedEmail = extractEmailFromToken(token);
      if (extractedEmail) {
        setEmail(extractedEmail);
        setStatus('error');
        setMessage('El código de verificación ha expirado. Haz clic en "Reenviar" para obtener uno nuevo.');
      } else {
        setStatus('error');
        setMessage('Inválido');
        setEmail(''); // No mostrar email para reenvío
      }
    }
  };

  // Función para extraer email del token (incluso si está expirado)
  const extractEmailFromToken = (token: string): string | null => {
    try {
      // Decodificar el JWT token (sin verificar firma)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      // Verificar que sea un token de verificación y extraer el email
      if (decodedPayload.type === 'verification' && decodedPayload.sub) {
        return decodedPayload.sub;
      }
      
      return null;
    } catch (error) {
      console.error('Error al extraer email del token:', error);
      return null;
    }
  };

  const handleResendEmail = async (emailToResend: string) => {
    if (!emailToResend.trim()) {
      setMessage('Por favor ingresa tu email');
      return;
    }

    try {
      const response = await authApi.resendVerificationEmail(emailToResend);
      
      if (response.success) {
        setResendMessage('Se ha enviado un nuevo código de verificación a tu email. Revisa tu bandeja de entrada.');
        setStatus('loading');
        setTimeout(() => {
          setStatus('error'); // Volver a error para mostrar el botón de reenviar
        }, 1000);
      } else {
        setResendMessage(response.error || 'Error al reenviar email');
      }
    } catch (error) {
      setResendMessage('Error al reenviar email de verificación');
    }
  };

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  return (
    <VerifyEmailForm
      status={status}
      message={message}
      email={email}
      onResendEmail={handleResendEmail}
      onBackToLogin={handleBackToLogin}
      resendMessage={resendMessage}
    />
  );
}

