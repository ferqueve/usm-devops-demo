import { StatsSummaryPanel } from './StatsSummaryPanel';
import { ExplainRecomendacionPanel } from './ExplainRecomendacionPanel';
import { AnalyzeForecastPanel } from './AnalyzeForecastPanel';
import { SemanticSearchPanel } from './SemanticSearchPanel';
import { ChatPanel } from './ChatPanel';
import { PageHeader } from '@/components/layouts/PageHeader';

export default function Asistente() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistente IA"
        description="Playground de la capa de IA generativa: lo que se prueba acá después se integra en las pantallas."
        accentColor="#9333ea"
      />

      <StatsSummaryPanel />
      <ExplainRecomendacionPanel />
      <AnalyzeForecastPanel />
      <SemanticSearchPanel />
      <ChatPanel />
    </div>
  );
}
