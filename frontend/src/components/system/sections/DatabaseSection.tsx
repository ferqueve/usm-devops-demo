import { memo } from 'react';
import { LiquibaseTimeline } from '@/components/ui/liquibase-timeline';

interface DatabaseSectionProps {
  health: any;
  liquibase: any;
}

export const DatabaseSection = memo(function DatabaseSection({ health, liquibase }: DatabaseSectionProps) {
  return (
    <div>
      <LiquibaseTimeline data={liquibase} health={health} />
    </div>
  );
});

