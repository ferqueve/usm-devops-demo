import { apiRequest, type LoginRequest, type RegisterRequest, type LoginResponse, type RegisterResponse, type ApiResponse } from './client';

// API de autenticación
export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Registro
  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Logout
  async logout(): Promise<ApiResponse<string>> {
    return apiRequest<string>('/auth/logout', {
      method: 'POST',
    });
  },

  // Verificar token
  async verifyToken(): Promise<ApiResponse<boolean>> {
    return apiRequest<boolean>('/auth/verify', {
      method: 'GET',
    });
  },

  // Verificar email
  async verifyEmail(token: string): Promise<ApiResponse<string>> {
    return apiRequest<string>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Reenviar email de verificación
  async resendVerificationEmail(email: string): Promise<ApiResponse<string>> {
    return apiRequest<string>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
