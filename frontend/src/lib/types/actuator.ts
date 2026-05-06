// Tipos para los endpoints actuator de Spring Boot.
// Se modelan los campos que efectivamente consume el frontend; el backend puede
// devolver más, por eso se mantienen como `unknown`/opcionales en lo restante.

export interface AppInfo {
  app?: {
    name?: string;
    version?: string;
    environment?: string;
    description?: string;
    'java.version'?: string;
  };
  build?: Record<string, unknown>;
  git?: Record<string, unknown>;
}

export interface HealthComponent {
  status?: string;
  details?: Record<string, unknown>;
  components?: Record<string, HealthComponent>;
}

export interface HealthInfo extends HealthComponent {
  status?: string;
  components?: Record<string, HealthComponent>;
}

export interface MetricMeasurement {
  statistic?: string;
  value?: number;
}

export interface MetricInfo {
  name?: string;
  description?: string;
  baseUnit?: string;
  measurements?: MetricMeasurement[];
  availableTags?: Array<{ tag: string; values: string[] }>;
}

export interface JvmInfo {
  memoria: MetricInfo | null;
  cpu: MetricInfo | null;
  threads: MetricInfo | null;
  uptime: MetricInfo | null;
}

export interface ActuatorEndpoints {
  _links?: Record<string, { href: string; templated?: boolean } | undefined>;
}

export interface DispatcherMapping {
  handler?: string;
  predicate?: string;
  details?: {
    requestMappingConditions?: {
      methods?: string[];
      patterns?: string[];
    };
  };
}

export interface MappingContext {
  mappings?: {
    dispatcherServlets?: Record<string, DispatcherMapping[]>;
  };
}

export interface MappingsInfo {
  contexts?: Record<string, MappingContext>;
}

export interface HttpExchange {
  timestamp?: string;
  request?: {
    uri?: string;
    method?: string;
    headers?: Record<string, string[]>;
  };
  response?: {
    status?: number;
    headers?: Record<string, string[]>;
  };
  timeTaken?: string;
  principal?: { name?: string };
}

export interface HttpTraceInfo {
  exchanges?: HttpExchange[];
}

export interface LoggerLevel {
  configuredLevel?: string | null;
  effectiveLevel?: string;
}

export interface LoggersInfo {
  levels?: string[];
  loggers?: Record<string, LoggerLevel>;
  groups?: Record<string, { configuredLevel?: string | null; members?: string[] }>;
}

export interface LiquibaseChangeSet {
  id: string;
  author: string;
  changeLog: string;
  dateExecuted?: string;
  description?: string;
  tag?: string;
  orderExecuted?: number;
}

export interface LiquibaseBean {
  changeSets?: LiquibaseChangeSet[];
}

export interface LiquibaseContext {
  liquibaseBeans?: Record<string, LiquibaseBean>;
}

export interface LiquibaseInfo {
  changeSets?: LiquibaseChangeSet[];
  contexts?: Record<string, LiquibaseContext>;
}
