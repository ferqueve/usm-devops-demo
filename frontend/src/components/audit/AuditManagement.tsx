import { useState, useEffect, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
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
  Eye,
  Loader2,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function getAccionBadge(accion: AuditLog['accion']) {
  switch (accion) {
    case 'CREATE':
      return <Badge className="bg-green-100 text-green-700 border-green-300">Crear</Badge>;
    case 'UPDATE':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Actualizar</Badge>;
    case 'DELETE':
      return <Badge className="bg-red-100 text-red-700 border-red-300">Eliminar</Badge>;
    default:
      return <Badge variant="outline">{accion}</Badge>;
  }
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
  const [showFilters, setShowFilters] = useState(true);
  
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
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Auditoría del Sistema</h2>
          <p className="text-muted-foreground">
            Registro de todos los cambios realizados en el sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 border rounded-lg shadow-sm bg-white h-10">
            <FileText className="h-4 w-4 text-utec-blue" />
            <span className="font-bold text-sm">{totalElements}</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">registros</span>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            className="h-10"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleExportPDF}
            className="h-10"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          
          <div 
            onClick={isRefreshing ? undefined : handleRefresh}
            className={`flex items-center gap-2 px-4 border rounded-lg shadow-sm bg-white h-10 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium whitespace-nowrap">Actualizar</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Tabla de logs */}
      <div className="border rounded-lg shadow-card overflow-hidden bg-white">
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
            <Table>
              <TableHeader style={{ backgroundColor: '#525961' }}>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[#d1d5db] min-w-[80px]">ID</TableHead>
                  <TableHead className="text-[#d1d5db] min-w-[120px]">Entidad</TableHead>
                  <TableHead className="text-[#d1d5db] min-w-[100px]">ID Entidad</TableHead>
                  <TableHead className="text-[#d1d5db] min-w-[100px]">Acción</TableHead>
                  <TableHead className="text-[#d1d5db] min-w-[150px]">Usuario</TableHead>
                  <TableHead className="text-[#d1d5db] min-w-[180px]">Fecha/Hora</TableHead>
                  <TableHead className="text-[#d1d5db] text-center min-w-[100px]">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className="hover:bg-muted/60 transition-colors"
                  >
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{log.entidad}</span>
                    </TableCell>
                    <TableCell>{log.entidadId}</TableCell>
                    <TableCell>
                      {getAccionBadge(log.accion)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.usuarioNombre || 'Sistema'}</p>
                        {log.usuarioEmail && (
                          <p className="text-xs text-muted-foreground">{log.usuarioEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="border-t p-4">
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
