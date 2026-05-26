import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { postAnalyzeForecast } from '@/lib/api/ai';

export function AnalyzeForecastPanel() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analizar() {
    setLoading(true);
    setError(null);
    setOut(null);
    try {
      const res = await postAnalyzeForecast({
        historico: [
          { fecha: '2026-05-12', real: 38 },
          { fecha: '2026-05-13', real: 42 },
          { fecha: '2026-05-14', real: 47 },
          { fecha: '2026-05-15', real: 50 },
        ],
        predicciones: [
          { fecha: '2026-05-20', prediccion: 52, bandaInferior: 45, bandaSuperior: 60 },
          { fecha: '2026-05-21', prediccion: 55, bandaInferior: 47, bandaSuperior: 63 },
        ],
        mape: 12.3,
      });
      if (res.success && res.data) {
        setOut(res.data.analisis);
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
        <CardTitle>Análisis natural del forecast Prophet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Interpreta predicciones y devuelve recomendaciones operativas.
        </p>
        <Button onClick={analizar} disabled={loading}>
          {loading ? 'Analizando…' : 'Analizar forecast'}
        </Button>
        {out && <p className="rounded bg-gray-50 p-3 text-sm">{out}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
