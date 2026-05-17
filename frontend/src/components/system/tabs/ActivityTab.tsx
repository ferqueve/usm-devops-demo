import { memo } from 'react';
import { HttpTraceSection } from '../sections/HttpTraceSection';
import { EndpointsSection } from '../sections/EndpointsSection';
import type { HttpTraceInfo, MappingsInfo } from '@/lib/types/actuator';

interface ActivityTabProps {
  httpTrace: HttpTraceInfo | null | undefined;
  mappings: MappingsInfo | null | undefined;
}

export const ActivityTab = memo(function ActivityTab({
  httpTrace,
  mappings
}: ActivityTabProps) {
  return (
    <div className="space-y-6">
      <HttpTraceSection httpTrace={httpTrace} />
      <EndpointsSection mappings={mappings} />
    </div>
  );
});
