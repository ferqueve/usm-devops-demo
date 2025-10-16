import { memo } from 'react';
import { Database } from 'lucide-react';
import { LiquibaseTimeline } from '@/components/ui/liquibase-timeline';

interface DatabaseSectionProps {
  health: any;
  liquibase: any;
}

export const DatabaseSection = memo(function DatabaseSection({ health, liquibase }: DatabaseSectionProps) {
  return (
    <section className="section-separator">
      <h3 className="section-title">
        <Database className="h-6 w-6 text-utec-blue" />
        Base de Datos
      </h3>

      <LiquibaseTimeline data={liquibase} health={health} />
    </section>
  );
});

