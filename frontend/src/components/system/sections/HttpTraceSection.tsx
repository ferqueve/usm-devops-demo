import { memo } from 'react';
import { HttpTraceTable } from '@/components/ui/http-trace-table';
import type { HttpTraceInfo } from '@/lib/types/actuator';

interface HttpTraceSectionProps {
  httpTrace: HttpTraceInfo | null | undefined;
}

export const HttpTraceSection = memo(function HttpTraceSection({ httpTrace }: HttpTraceSectionProps) {
  return <HttpTraceTable data={httpTrace} />;
});
