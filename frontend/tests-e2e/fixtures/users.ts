/**
 * Usuarios sembrados por `E2EDataSeeder` (backend, perfil `e2e`).
 * Mantener sincronizado con
 * `backend/src/main/java/com/utec/backend/e2e/E2EDataSeeder.java`.
 */
export const SEED_PASSWORD = 'Test1234!';

export const seedUsers = {
  admin: { email: 'admin@e2e.test', password: SEED_PASSWORD, rol: 'ADMIN' },
  analista: { email: 'analista@e2e.test', password: SEED_PASSWORD, rol: 'ANALISTA' },
  docente: { email: 'docente@e2e.test', password: SEED_PASSWORD, rol: 'DOCENTE' },
  estudiante: { email: 'estudiante@e2e.test', password: SEED_PASSWORD, rol: 'ESTUDIANTE' },
  externo: { email: 'externo@e2e.test', password: SEED_PASSWORD, rol: 'EXTERNO' },
  mantenimiento: { email: 'mantenimiento@e2e.test', password: SEED_PASSWORD, rol: 'MANTENIMIENTO' },
} as const;

export type SeedRole = keyof typeof seedUsers;
