// Factories para construir datos de prueba consistentes.
// Cada factory acepta overrides parciales para que los tests solo declaren
// los campos que les importan.

let idCounter = 1;
const nextId = () => idCounter++;

export interface UserFixture {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'ANALISTA' | 'ESTUDIANTE' | 'DOCENTE' | 'ENCARGADO';
}

export const makeUser = (overrides: Partial<UserFixture> = {}): UserFixture => ({
  id: nextId(),
  email: 'test@utec.edu.uy',
  nombre: 'Test',
  apellido: 'User',
  rol: 'ESTUDIANTE',
  ...overrides,
});

export const makeLoginResponse = (user: Partial<UserFixture> = {}) => {
  const u = makeUser(user);
  return {
    id: u.id,
    token: 'mock-jwt-token-' + u.id,
    refreshToken: 'mock-refresh-token-' + u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    expiresIn: 3600,
  };
};

export interface ReservaFixture {
  id: number;
  espacioId: number;
  espacioNombre: string;
  usuarioId: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  motivo: string;
}

export const makeReserva = (overrides: Partial<ReservaFixture> = {}): ReservaFixture => ({
  id: nextId(),
  espacioId: 1,
  espacioNombre: 'Sala 101',
  usuarioId: 1,
  fechaInicio: '2026-06-01T10:00:00Z',
  fechaFin: '2026-06-01T12:00:00Z',
  estado: 'PENDIENTE',
  motivo: 'Reunión de equipo',
  ...overrides,
});

export interface EspacioFixture {
  id: number;
  nombre: string;
  capacidad: number;
  edificioId: number;
  tipoEspacioId: number;
}

export const makeEspacio = (overrides: Partial<EspacioFixture> = {}): EspacioFixture => ({
  id: nextId(),
  nombre: 'Sala 101',
  capacidad: 30,
  edificioId: 1,
  tipoEspacioId: 1,
  ...overrides,
});

export interface InventoryItemFixture {
  id: number;
  nombre: string;
  tipoElementoId: number;
  espacioId: number | null;
  estado: 'DISPONIBLE' | 'EN_USO' | 'EN_MANTENIMIENTO' | 'DADO_DE_BAJA';
}

export const makeInventoryItem = (
  overrides: Partial<InventoryItemFixture> = {}
): InventoryItemFixture => ({
  id: nextId(),
  nombre: 'Proyector Epson',
  tipoElementoId: 1,
  espacioId: 1,
  estado: 'DISPONIBLE',
  ...overrides,
});

export const resetIdCounter = () => {
  idCounter = 1;
};
