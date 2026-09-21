import { useSearchParams } from 'react-router-dom';
import { FlaskConical, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader, HEADER_ACTION } from '@/components/layouts/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/config/constants';
import { cn } from '@/lib/utils/helpers';
import { ChatPanel } from './ChatPanel';
import { SemanticSearchPanel } from './SemanticSearchPanel';
import { IaEnPantallas } from './IaEnPantallas';
import { Laboratorio } from './Laboratorio';

export default function Asistente() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const esAdmin = user?.rol === ROLES.ADMIN;
  const enLaboratorio = esAdmin && params.get('vista') === 'laboratorio';

  return (
    // Igual que el dashboard: en pantallas grandes entra en una sola pantalla
    // y cada panel scrollea por dentro.
    <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:h-full lg:shrink lg:overflow-hidden">
      <PageHeader
        title="Asistente IA"
        description="Preguntá en lenguaje natural sobre reservas, espacios e inventario"
        accentColor="#9333ea"
        actions={
          esAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(HEADER_ACTION, enLaboratorio && 'bg-white/10 text-white')}
              onClick={() => setParams(enLaboratorio ? {} : { vista: 'laboratorio' }, { replace: true })}
            >
              {enLaboratorio
                ? <><MessageSquareText className="mr-1.5 h-3.5 w-3.5" />Volver al chat</>
                : <><FlaskConical className="mr-1.5 h-3.5 w-3.5" />Laboratorio</>}
            </Button>
          )
        }
      />

      {enLaboratorio ? (
        <Laboratorio />
      ) : (
        <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1">
          <ChatPanel />
          <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
            <SemanticSearchPanel />
            <IaEnPantallas />
          </div>
        </div>
      )}
    </div>
  );
}
