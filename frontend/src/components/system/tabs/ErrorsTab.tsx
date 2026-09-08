import { memo } from 'react';
import { RecentErrorsCard } from '../sections/RecentErrorsCard';
import { HttpTraceSection } from '../sections/HttpTraceSection';
import type { HttpTraceInfo } from '@/lib/types/actuator';

interface ErrorsTabProps {
  httpTrace: HttpTraceInfo | null | undefined;
}

export const ErrorsTab = memo(function ErrorsTab({ httpTrace }: ErrorsTabProps) {
  return (
    <div className="space-y-6">
      <section>
        <RecentErrorsCard />
      </section>
      <section>
        <HttpTraceSection httpTrace={httpTrace} />
      </section>
    </div>
  );
});
