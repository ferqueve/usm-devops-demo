import { useState, useEffect, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { auditApi } from '@/lib/api/audit';
import { exportAuditLogsToCSV, exportAuditLogsToPDF } from '@/lib/utils/audit-export';
import type { AuditLog, AuditLogFilters } from '@/lib/types/audit';
import AuditFilters from './AuditFilters';
import AuditLogDetailsDialog from './AuditLogDetailsDialog';
import {
  FileText,
  RefreshCw,
  Loader2,
  FileDown,
  FileSpreadsheet,
  Eye,
  Download,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader, HEADER_ACTION, HEADER_ACTION_ICON } from '@/components/layouts/PageHeader';

const ACCION_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  CREATE: { label: 'Crear', badge: 'bg-utec-green text-white border-utec-green', dot: 'bg-utec-green' },
  UPDATE: { label: 'Actualizar', badge: 'bg-utec-blue text-white border-utec-blue', dot: 'bg-utec-blue' },
  DELETE: { label: 'Eliminar', badge: 'bg-utec-red text-white border-utec-red', dot: 'bg-utec-red' },
};

function getAccionBadge(accion: AuditLog['accion']) {
  const cfg = ACCION_CONFIG[accion];
  if (!cfg) {
    return <Badge variant="outline">{accion}</Badge>;
  }
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium ${cfg.badge}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </Badge>
  );
}

export default function AuditManagement() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<AuditLogFilters>({});
  
  // Modal de detalles
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auditApi.listarLogsAuditoria(filters, page, pageSize);
      
      setLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los logs de auditoría';
      console.error('Error al cargar logs:', error);
      toast.error('Error al cargar logs', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialog(true);
  };

  const handleExportCSV = () => {
    try {
      if (logs.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }
      exportAuditLogsToCSV(logs);
      toast.success('Exportación completada', {
        description: 'El archivo CSV se ha descargado exitosamente'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo exportar el archivo CSV';
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar', {
        description: errorMessage
      });
    }
  };

  const handleExportPDF = () => {
    try {
      if (logs.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }
      exportAuditLogsToPDF(logs, filters);
      toast.success('Exportación completada', {
        description: 'El archivo PDF se ha descargado exitosamente'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo exportar el archivo PDF';
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar', {
        description: errorMessage
      });
    }
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
    toast.info('Filtros limpiados');
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando logs de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        count={totalElements}
        description="Cambios realizados en el sistema, con su autor y su fecha."
        accentColor="#DF2B31"
        actions={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isRefreshing ? undefined : handleRefresh}
                  disabled={isRefreshing}
                  aria-label="Actualizar"
                  className={HEADER_ACTION_ICON}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualizar</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={HEADER_ACTION}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Exportar
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* Tabla de logs con filtros embebidos */}
      <div className="border rounded-lg shadow-card overflow-hidden bg-card">
        <div className="px-4 pt-4 pb-3">
          <AuditFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>
        {logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No se encontraron registros"
            description="No hay logs de auditoría que coincidan con los criterios de búsqueda"
            action={{
              label: 'Limpiar filtros',
              onClick: clearFilters
            }}
          />
        ) : (
          <>
            <div className="px-4 pt-4">
              <div className="overflow-x-auto border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-utec-dark">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="h-10 bg-utec-dark text-white/70 w-[90px]">ID</TableHead>
                  <TableHead className="h-10 bg-utec-dark text-white/70 min-w-[140px]">Entidad</TableHead>
                  <TableHead className="h-10 bg-utec-dark text-white/70 w-[100px]">ID Entidad</TableHead>
                  <TableHead className="h-10 bg-utec-dark text-white/70 w-[130px]">Acción</TableHead>
                  <TableHead className="h-10 bg-utec-dark text-white/70 min-w-[200px]">Usuario</TableHead>
                  <TableHead className="h-10 bg-utec-dark text-white/70 min-w-[200px]">Fecha/Hora</TableHead>
                  <TableHead className="h-10 bg-utec-dark text-white/70 text-right w-[80px]">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const fecha = new Date(log.timestamp);
                  const relativo = formatDistanceToNow(fecha, { locale: es, addSuffix: true });
                  const accionCfg = ACCION_CONFIG[log.accion];
                  return (
                    <TableRow key={log.id} className="group">
                      <TableCell className="py-2 font-mono text-xs text-muted-foreground tabular-nums">
                        <span className="flex items-center gap-1.5">
                          {accionCfg && (
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${accionCfg.dot}`}
                              aria-hidden="true"
                            />
                          )}
                          #{log.id}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 font-medium">{log.entidad}</TableCell>
                      <TableCell className="py-2 text-muted-foreground tabular-nums">
                        {log.entidadId}
                      </TableCell>
                      <TableCell className="py-2">{getAccionBadge(log.accion)}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{log.usuarioNombre || 'Sistema'}</span>
                          {log.usuarioEmail && (
                            <span className="text-xs text-muted-foreground">{log.usuarioEmail}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col leading-tight tabular-nums">
                          <span className="text-sm">
                            {format(fecha, "dd MMM yyyy, HH:mm:ss", { locale: es })}
                          </span>
                          <span className="text-xs text-muted-foreground">{relativo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(log)}
                              aria-label="Ver detalles"
                              className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalles</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => page > 0 && setPage(page - 1)}
                        className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {totalPages > 5 && page < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => page < totalPages - 1 && setPage(page + 1)}
                        className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Página {page + 1} de {totalPages} ({totalElements} registros)
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog de detalles */}
      <AuditLogDetailsDialog
        log={selectedLog}
        open={detailsDialog}
        onOpenChange={setDetailsDialog}
      />
    </div>
  );
}
