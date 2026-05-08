// Helper para sembrar autenticación en localStorage antes de renderizar
// componentes que requieren sesión.

export type Rol = 'ADMIN' | 'ANALISTA' | 'ESTUDIANTE' | 'DOCENTE' | 'ENCARGADO';

interface SeedUser {
  id?: number;
  email?: string;
  nombre?: string;
  rol: Rol;
}

export function loginAs(rolOrUser: Rol | SeedUser) {
  const u: Required<SeedUser> =
    typeof rolOrUser === 'string'
      ? { id: 1, email: 'test@utec.edu.uy', nombre: 'Test', rol: rolOrUser }
      : {
          id: rolOrUser.id ?? 1,
          email: rolOrUser.email ?? 'test@utec.edu.uy',
          nombre: rolOrUser.nombre ?? 'Test',
          rol: rolOrUser.rol,
        };

  localStorage.setItem('token', 'mock-jwt-token-1');
  localStorage.setItem('refreshToken', 'mock-refresh-token-1');
  localStorage.setItem('user', JSON.stringify(u));
  // El AuthProvider también guarda este flag interno
  localStorage.setItem(
    'utec_auth',
    JSON.stringify({ isAuthenticated: true, timestamp: Date.now() })
  );
  return u;
}
