export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  email: string;
  nombre: string;
  rol: string;
  expiresIn: number;
  userId: number;
};

export type Espacio = {
  id: number;
  nombre: string;
  capacidad: number;
  imagenUrl?: string;
  tipoEspacioNombre?: string;
  tipoEspacioColor?: string;
  estado: string;
  edificioNombre?: string;
  edificioCodigo?: string;
};
