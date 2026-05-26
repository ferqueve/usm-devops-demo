import { StatsSummaryPanel } from './StatsSummaryPanel';
import { ExplainRecomendacionPanel } from './ExplainRecomendacionPanel';
import { AnalyzeForecastPanel } from './AnalyzeForecastPanel';
import { SemanticSearchPanel } from './SemanticSearchPanel';
import { ChatPanel } from './ChatPanel';

export default function Asistente() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-utec-dark">Asistente IA</h1>
        <p className="text-sm text-gray-600">
          Playground de la capa de IA generativa. Las funcionalidades probadas
          acá se integran después en las pantallas correspondientes.
        </p>
      </header>

      <StatsSummaryPanel />
      <ExplainRecomendacionPanel />
      <AnalyzeForecastPanel />
      <SemanticSearchPanel />
      <ChatPanel />
    </div>
  );
}
