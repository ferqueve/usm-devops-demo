import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { postExplainRecomendacion } from '@/lib/api/ai';

export function ExplainRecomendacionPanel() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function explicar() {
    setLoading(true);
    setError(null);
    setOut(null);
    try {
      const res = await postExplainRecomendacion({
        recomendacion: {
          espacioNombre: 'Sala 203',
          capacidad: 30,
          tipoEspacioNombre: 'Salón con proyector',
          puntaje: 0.85,
          razon: 'Disponibilidad alta los jueves y uso frecuente en tu carrera',
        },
        contexto_usuario: { rol: 'DOCENTE', carrera: 'Ingeniería Logística' },
      });
      if (res.success && res.data) {
        setOut(res.data.explicacion);
      } else {
        setError(res.error || 'Sin respuesta');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explicación natural de recomendación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Humaniza la razón heurística del recomendador (mock por ahora).
        </p>
        <Button onClick={explicar} disabled={loading}>
          {loading ? 'Explicando…' : 'Explicar recomendación de ejemplo'}
        </Button>
        {out && <p className="rounded bg-gray-50 p-3 text-sm">{out}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
