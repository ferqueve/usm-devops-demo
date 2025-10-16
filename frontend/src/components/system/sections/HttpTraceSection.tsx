import { memo } from 'react';
import { HttpTraceTable } from '@/components/ui/http-trace-table';

interface HttpTraceSectionProps {
  httpTrace: any;
}

export const HttpTraceSection = memo(function HttpTraceSection({ httpTrace }: HttpTraceSectionProps) {
  return <HttpTraceTable data={httpTrace} />;
});
