import { http } from '../http';

export type HealthComponent = {
  status: string;
  details?: Record<string, unknown>;
};

export type Health = {
  status: string;
  components?: Record<string, HealthComponent>;
};

export type ActiveUser = {
  email: string;
  nombre: string;
  apellido?: string;
  rol: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
};

export type ActiveUsers = {
  totalActiveUsers: number;
  activeUsers: ActiveUser[];
};

export type Metric = {
  name: string;
  measurements: { statistic: string; value: number }[];
};

/** GET /actuator/health */
export function getHealth(): Promise<Health> {
  return http.hostGet<Health>('/actuator/health');
}

/** GET /actuator/metrics/{name} */
export function getMetric(name: string): Promise<Metric> {
  return http.hostGet<Metric>(`/actuator/metrics/${name}`);
}

/** GET /stats/active-users (sin envelope) */
export function getActiveUsers(): Promise<ActiveUsers> {
  return http.getRaw<ActiveUsers>('/stats/active-users');
}

/** Valor de la primera medición de una métrica (o null). */
export function metricValue(m: Metric | null): number | null {
  return m?.measurements?.[0]?.value ?? null;
}
