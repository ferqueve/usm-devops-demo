import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { postStatsSummary } from '@/lib/api/ai';

export function StatsSummaryPanel() {
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setLoading(true);
    setError(null);
    setResumen(null);
    try {
      const res = await postStatsSummary({
        periodo: 'últimos 30 días',
        stats: {
          total_reservas: 0,
          ocupacion_promedio: 0,
          top_espacios: [],
        },
      });
      if (res.success && res.data) {
        setResumen(res.data.resumen);
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
        <CardTitle>Resumen automático de estadísticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Genera un resumen ejecutivo del estado del sistema en lenguaje natural.
        </p>
        <Button onClick={generar} disabled={loading}>
          {loading ? 'Generando…' : 'Generar resumen'}
        </Button>
        {resumen && <p className="rounded bg-gray-50 p-3 text-sm">{resumen}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
