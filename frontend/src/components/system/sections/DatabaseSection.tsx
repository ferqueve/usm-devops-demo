import { memo } from 'react';
import { LiquibaseTimeline } from '@/components/ui/liquibase-timeline';
import type { HealthInfo, LiquibaseInfo } from '@/lib/types/actuator';

interface DatabaseSectionProps {
  health: HealthInfo | null | undefined;
  liquibase: LiquibaseInfo | null | undefined;
}

export const DatabaseSection = memo(function DatabaseSection({ health, liquibase }: DatabaseSectionProps) {
  return (
    <div>
      <LiquibaseTimeline data={liquibase} health={health} />
    </div>
  );
});

