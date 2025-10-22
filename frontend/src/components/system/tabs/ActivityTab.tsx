import { memo } from 'react';
import { Globe, List } from 'lucide-react';
import { HttpTraceSection } from '../sections/HttpTraceSection';
import { EndpointsSection } from '../sections/EndpointsSection';

interface ActivityTabProps {
  httpTrace: any;
  mappings: any;
}

export const ActivityTab = memo(function ActivityTab({
  httpTrace,
  mappings
}: ActivityTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HTTP Trace */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-utec-green" />
            HTTP Trace
          </span>
        </h3>
        <HttpTraceSection httpTrace={httpTrace} />
      </section>

      {/* Endpoints REST */}
      <section>
        <h3 className="section-title mb-4">
          <span className="flex items-center gap-2">
            <List className="h-5 w-5 text-utec-orange" />
            Endpoints REST
          </span>
        </h3>
        <EndpointsSection mappings={mappings} />
      </section>
    </div>
  );
});
