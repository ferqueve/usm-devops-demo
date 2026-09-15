import { apiRequest, type ApiResponse } from './client';

export interface StatsSummaryRequest {
  periodo: string;
  stats: Record<string, unknown>;
}

export interface ExplainRecomendacionRequest {
  recomendacion: Record<string, unknown>;
  contexto_usuario?: Record<string, unknown>;
}

export interface AnalyzeForecastRequest {
  historico: Array<Record<string, unknown>>;
  predicciones: Array<Record<string, unknown>>;
  mape?: number | null;
  wape?: number | null;
  reservadas?: Array<Record<string, unknown>>;
}

export interface SemanticSearchResultado {
  espacio_id: number;
  texto_indexado: string;
  similitud: number;
}

export interface SemanticSearchResponse {
  query: string;
  resultados: SemanticSearchResultado[];
}

export interface ChatRequest {
  mensaje: string;
  usuario_id: number;
  rol: string;
  historial?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  respuesta: string;
  tools_invocados?: string[];
}

const base = '/ai';

/**
 * Cuando el servicio de IA no responde, el backend degrada en vez de tumbar la
 * request: contesta 200 con `success: true` y un `{status:"error", error:"..."}`
 * escondido dentro de `data`. Sin esto, quien llama no puede distinguir "la IA no
 * tenía nada que decir" de "la IA está caída", y la pantalla falla en silencio.
 */
function verificarIA<T>(r: ApiResponse<T>): ApiResponse<T> {
  const posibleError = r.data as { status?: string; error?: string } | undefined;
  if (posibleError?.status === 'error') {
    throw new Error(posibleError.error ?? 'El servicio de IA no está disponible');
  }
  return r;
}

/** Igual que verificarIA, pero devuelve el dato ya desenvuelto. */
function desempaquetarIA<T>(r: ApiResponse<T>): T {
  const data = verificarIA(r).data;
  if (!data) {
    throw new Error('El servicio de IA no devolvió respuesta');
  }
  return data;
}

export async function postStatsSummary(payload: StatsSummaryRequest): Promise<ApiResponse<{ resumen: string }>> {
  return verificarIA(await apiRequest<{ resumen: string }>(`${base}/insights/stats-summary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export async function postExplainRecomendacion(payload: ExplainRecomendacionRequest): Promise<ApiResponse<{ explicacion: string }>> {
  return verificarIA(await apiRequest<{ explicacion: string }>(`${base}/insights/explain-recomendacion`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export async function postAnalyzeForecast(payload: AnalyzeForecastRequest): Promise<ApiResponse<{ analisis: string }>> {
  return verificarIA(await apiRequest<{ analisis: string }>(`${base}/insights/analyze-forecast`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export interface AnalyzeInventarioForecastRequest {
  wape: number | null;
  tipos: Array<{
    nombre: string;
    stockDisponible: number | null;
    picoEsperado: number | null;
    fechaPico: string | null;
    probFaltanteMax: number | null;
    diasEnRiesgo: number | null;
    riesgo: string | null;
    comprometidasMax: number | null;
  }>;
}

export async function postAnalyzeInventarioForecast(payload: AnalyzeInventarioForecastRequest): Promise<ApiResponse<{ analisis: string }>> {
  return verificarIA(await apiRequest<{ analisis: string }>(`${base}/insights/analyze-inventario-forecast`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export interface AnalyzeAsistenciaRequest {
  auc: number | null;
  tasaBase: number | null;
  resumen: Record<string, unknown>;
  /** Hasta 25: con más, el prompt crece y el análisis no mejora. */
  proximas: Array<{
    materia: string;
    inicio: string;
    cupo: number | null;
    inscriptos: number;
    esperados: number | null;
    riesgo: string;
  }>;
  factores: Array<{ nombre: string; oddsRatio: number }>;
}

export async function postAnalyzeAsistencia(payload: AnalyzeAsistenciaRequest): Promise<ApiResponse<{ analisis: string }>> {
  return verificarIA(await apiRequest<{ analisis: string }>(`${base}/insights/analyze-asistencia`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export async function getSemanticSearch(q: string, top = 5): Promise<ApiResponse<SemanticSearchResponse>> {
  return verificarIA(await apiRequest<SemanticSearchResponse>(`${base}/search/espacios?q=${encodeURIComponent(q)}&top=${top}`));
}

export async function postReindexEmbeddings(): Promise<ApiResponse<{ status: string; indexed: number; model: string }>> {
  // Ojo: esta respuesta trae un `status` propio ("ok"), así que sólo se descarta
  // cuando dice "error", que es lo que verificarIA mira.
  return verificarIA(await apiRequest<{ status: string; indexed: number; model: string }>(`${base}/admin/reindex-embeddings`, { method: 'POST' }));
}

export async function postChat(payload: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  return verificarIA(await apiRequest<ChatResponse>(`${base}/chat`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export interface GenerarEventoRequest {
  idea: string;
  tipo?: string;
}

export interface GenerarEventoResponse {
  titulo: string;
  descripcion: string;
  tags: string;
}

export async function postGenerarEvento(payload: GenerarEventoRequest): Promise<ApiResponse<GenerarEventoResponse>> {
  return verificarIA(await apiRequest<GenerarEventoResponse>(`${base}/insights/generar-evento`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export async function postResumenTemario(payload: { materia?: string; temarios: string[] }): Promise<{ resumen: string }> {
  return desempaquetarIA(await apiRequest<{ resumen: string }>(`${base}/insights/resumen-temario`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}
