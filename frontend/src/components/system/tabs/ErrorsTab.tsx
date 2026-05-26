import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { ExternalLink } from 'lucide-react';
import { RecentErrorsCard } from '../sections/RecentErrorsCard';
import { HttpTraceSection } from '../sections/HttpTraceSection';
import type { HttpTraceInfo } from '@/lib/types/actuator';

interface ErrorsTabProps {
  httpTrace: HttpTraceInfo | null | undefined;
}

const SWAGGER_URL = `${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080'}/swagger-ui.html`;

export const ErrorsTab = memo(function ErrorsTab({ httpTrace }: ErrorsTabProps) {
  return (
    <div className="space-y-6">
      <section>
        <RecentErrorsCard />
      </section>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Últimas requests HTTP</h3>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8"
          >
            <a href={SWAGGER_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Ver API en Swagger
            </a>
          </Button>
        </div>
        <HttpTraceSection httpTrace={httpTrace} />
      </section>
    </div>
  );
});
