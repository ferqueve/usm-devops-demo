import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface ChangeSet {
  id: string;
  author: string;
  changeLog: string;
  dateExecuted?: string;
  description?: string;
  tag?: string;
  orderExecuted?: number;
}

interface LiquibaseTimelineProps {
  data: any;
  health: any;
}

export function LiquibaseTimeline({ data, health }: LiquibaseTimelineProps) {
  // Extraer changesets del formato de actuator
  // Spring Boot puede retornar en diferentes formatos
  let changeSets: ChangeSet[] = [];
  
  if (data) {
    // Intentar diferentes estructuras posibles de Spring Boot Actuator
    if (data.changeSets && Array.isArray(data.changeSets)) {
      changeSets = data.changeSets;
    } else if (data.contexts) {
      // Para Spring Boot 2.x/3.x con contexts
      // Buscar en todos los contextos disponibles
      const contextKeys = Object.keys(data.contexts);
      
      for (const contextKey of contextKeys) {
        const context = data.contexts[contextKey];
        
        if (context?.liquibaseBeans) {
          // Buscar el primer bean de liquibase con changeSets
          const beanKeys = Object.keys(context.liquibaseBeans);
          
          for (const beanKey of beanKeys) {
            if (context.liquibaseBeans[beanKey]?.changeSets && Array.isArray(context.liquibaseBeans[beanKey].changeSets)) {
              changeSets = context.liquibaseBeans[beanKey].changeSets;
              break;
            }
          }
          
          if (changeSets.length > 0) break;
        }
      }
    }
  }

  const dbStatus = health?.components?.db?.status || 'UNKNOWN';
  const dbDetails = health?.components?.db?.details;

  if (!changeSets.length) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-utec-blue" />
            Base de Datos
            <StatusBadge 
              status={dbStatus === 'UP' ? 'success' : 'error'}
              label={dbStatus}
              icon={false}
              className="ml-auto"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Detalles de DB */}
          {dbDetails && (
            <div className="mb-4 pb-3 border-b">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                {Object.entries(dbDetails).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">
              No hay información de migraciones Liquibase disponible.
            </p>
            <p className="text-xs text-muted-foreground">
              Verifica que el endpoint <code className="bg-gray-100 px-2 py-1 rounded">actuator/liquibase</code> esté habilitado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-utec-blue" />
          Base de Datos
          <StatusBadge 
            status={dbStatus === 'UP' ? 'success' : 'error'}
            label={dbStatus}
            icon={false}
            className="ml-2"
          />
          <Badge variant="secondary" className="ml-auto">
            {changeSets.length} migraciones
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Detalles de DB */}
        {dbDetails && (
          <div className="mb-4 pb-3 border-b">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              {Object.entries(dbDetails).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-medium">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla de migraciones */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[100px]">Autor</TableHead>
                <TableHead className="w-[150px]">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changeSets.map((changeSet, index) => (
                <TableRow key={`${changeSet.id}-${index}`}>
                  <TableCell className="font-medium text-xs text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {changeSet.orderExecuted || index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{changeSet.id}</TableCell>
                  <TableCell className="text-xs">
                    <div className="max-w-[300px]">
                      <p className="truncate">{changeSet.description || '-'}</p>
                      {changeSet.changeLog && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {changeSet.changeLog}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{changeSet.author}</TableCell>
                  <TableCell className="text-xs">
                    {changeSet.dateExecuted 
                      ? new Date(changeSet.dateExecuted).toLocaleDateString('es', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

