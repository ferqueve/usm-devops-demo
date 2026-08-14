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

export async function postStatsSummary(payload: StatsSummaryRequest): Promise<ApiResponse<{ resumen: string }>> {
  return apiRequest(`${base}/insights/stats-summary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function postExplainRecomendacion(payload: ExplainRecomendacionRequest): Promise<ApiResponse<{ explicacion: string }>> {
  return apiRequest(`${base}/insights/explain-recomendacion`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function postAnalyzeForecast(payload: AnalyzeForecastRequest): Promise<ApiResponse<{ analisis: string }>> {
  return apiRequest(`${base}/insights/analyze-forecast`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSemanticSearch(q: string, top = 5): Promise<ApiResponse<SemanticSearchResponse>> {
  return apiRequest(`${base}/search/espacios?q=${encodeURIComponent(q)}&top=${top}`);
}

export async function postReindexEmbeddings(): Promise<ApiResponse<{ status: string; indexed: number; model: string }>> {
  return apiRequest(`${base}/admin/reindex-embeddings`, { method: 'POST' });
}

export async function postChat(payload: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  return apiRequest(`${base}/chat`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
  return apiRequest(`${base}/insights/generar-evento`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Cuando el servicio de IA no responde, el backend degrada en vez de tumbar la
 * request: contesta 200 con `{status:"error", error:"..."}` dentro de `data`.
 * Esta forma se convierte en un throw para que quien llama no tenga que
 * distinguir entre "no hay resumen" y "la IA está caída".
 */
function desempaquetarIA<T>(data: T | undefined): T {
  const posibleError = data as { status?: string; error?: string } | undefined;
  if (posibleError?.status === 'error') {
    throw new Error(posibleError.error ?? 'El servicio de IA no está disponible');
  }
  if (!data) {
    throw new Error('El servicio de IA no devolvió respuesta');
  }
  return data;
}

export async function postResumenTemario(payload: { materia?: string; temarios: string[] }): Promise<{ resumen: string }> {
  const r = await apiRequest<{ resumen: string }>(`${base}/insights/resumen-temario`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return desempaquetarIA(r.data);
}
