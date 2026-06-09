import { http } from '../http';

export type ChatResponse = {
  respuesta: string;
  tools_invocados?: string[];
  provider?: string;
  status?: string;
  error?: string;
};

/** POST /ai/chat — el backend proxea al servicio de IA generativa. */
export function postChat(mensaje: string): Promise<ChatResponse> {
  return http.post<ChatResponse>('/ai/chat', { mensaje });
}
