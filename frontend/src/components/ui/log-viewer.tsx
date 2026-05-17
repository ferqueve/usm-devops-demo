import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Search, Download, Copy, ArrowDown, Settings, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { LoggersInfo, LoggerLevel } from '@/lib/types/actuator';

interface Logger {
  name: string;
  configuredLevel: string | null;
  effectiveLevel: string;
}

interface LogViewerProps {
  content: string;
  maxLines?: number;
  loggers?: LoggersInfo | null;
  onLoggerUpdate?: (name: string, level: string) => Promise<void>;
}

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'ALL';

const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'OFF'];

export function LogViewer({ content, maxLines = 1000, loggers, onLoggerUpdate }: Readonly<LogViewerProps>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [autoScroll, setAutoScroll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Estados para el diálogo de configuración de loggers
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [loggerSearchTerm, setLoggerSearchTerm] = useState('');
  const [loggerLevelFilter, setLoggerLevelFilter] = useState<string>('ALL');
  const [loggerPackageFilter, setLoggerPackageFilter] = useState<string>('ALL');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parsear líneas del log
  const lines = useMemo(() => {
    if (!content) return [];
    const allLines = content.split('\n');
    // Tomar solo las últimas N líneas
    return allLines.slice(-maxLines);
  }, [content, maxLines]);

  // Detectar nivel de log de una línea
  const detectLogLevel = (line: string): LogLevel => {
    if (line.includes('ERROR')) return 'ERROR';
    if (line.includes('WARN')) return 'WARN';
    if (line.includes('INFO')) return 'INFO';
    if (line.includes('DEBUG')) return 'DEBUG';
    if (line.includes('TRACE')) return 'TRACE';
    return 'ALL';
  };

  // Filtrar líneas
  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      const level = detectLogLevel(line);
      const matchesLevel = levelFilter === 'ALL' || level === levelFilter;
      const matchesSearch = !searchTerm || line.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [lines, searchTerm, levelFilter]);

  // Auto-scroll al final
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLines, autoScroll]);

  // Resaltar términos de búsqueda
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={`${part}-${i}`} className="bg-yellow-200 text-gray-900">{part}</mark>
      ) : part
    );
  };

  // Obtener clase CSS según nivel
  const getLineClass = (line: string) => {
    const level = detectLogLevel(line);
    switch (level) {
      case 'ERROR':
        return 'log-error';
      case 'WARN':
        return 'log-warn';
      default:
        return '';
    }
  };

  // Descargar log completo
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-log-${new Date().toISOString()}.log`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Log descargado');
  };

  // Copiar al portapapeles
  const handleCopy = () => {
    navigator.clipboard.writeText(filteredLines.join('\n'));
    toast.success('Log copiado al portapapeles');
  };

  // --- Funciones para configuración de loggers ---
  
  // Extraer loggers del formato de actuator
  const loggersArray: Logger[] = useMemo(() => {
    if (!loggers?.loggers) return [];
    return Object.entries(loggers.loggers).map(([name, config]: [string, LoggerLevel]) => ({
      name,
      configuredLevel: config.configuredLevel ?? null,
      effectiveLevel: config.effectiveLevel ?? ''
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [loggers]);

  // Extraer paquetes únicos para el filtro
  const uniquePackages = useMemo(() => {
    const packages = new Set<string>();
    loggersArray.forEach(logger => {
      // Extraer el paquete raíz (primeros 2-3 segmentos)
      const parts = logger.name.split('.');
      if (parts.length > 2) {
        packages.add(`${parts[0]}.${parts[1]}`);
      }
    });
    return Array.from(packages).sort((a, b) => a.localeCompare(b));
  }, [loggersArray]);

  // Filtrar loggers con todos los filtros
  const filteredLoggers = useMemo(() => {
    let filtered = loggersArray;

    // Filtro de búsqueda
    if (loggerSearchTerm) {
      filtered = filtered.filter(logger => 
        logger.name.toLowerCase().includes(loggerSearchTerm.toLowerCase())
      );
    }

    // Filtro por nivel
    if (loggerLevelFilter !== 'ALL') {
      filtered = filtered.filter(logger => {
        const currentLevel = logger.configuredLevel || logger.effectiveLevel;
        return currentLevel === loggerLevelFilter;
      });
    }

    // Filtro por paquete
    if (loggerPackageFilter !== 'ALL') {
      filtered = filtered.filter(logger => 
        logger.name.startsWith(loggerPackageFilter)
      );
    }

    // Filtro solo modificados
    if (showOnlyModified) {
      filtered = filtered.filter(logger => changes[logger.name] !== undefined);
    }

    // Limitar resultados
    return filtered.slice(0, 100);
  }, [loggersArray, loggerSearchTerm, loggerLevelFilter, loggerPackageFilter, showOnlyModified, changes]);

  // Obtener color para nivel de log
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      TRACE: 'bg-gray-100 text-gray-800 border-gray-200',
      DEBUG: 'bg-blue-100 text-blue-800 border-blue-200',
      INFO: 'bg-green-100 text-green-800 border-green-200',
      WARN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ERROR: 'bg-red-100 text-red-800 border-red-200',
      OFF: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Manejar cambio de nivel
  const handleLevelChange = (loggerName: string, newLevel: string) => {
    setChanges(prev => ({
      ...prev,
      [loggerName]: newLevel
    }));
  };

  // Aplicar cambios
  const handleApplyChanges = async () => {
    if (!onLoggerUpdate) return;
    
    setSaving(true);
    try {
      const changesList = Object.entries(changes);
      let successCount = 0;
      let errorCount = 0;

      for (const [name, level] of changesList) {
        try {
          await onLoggerUpdate(name, level);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error updating logger ${name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} logger(s) actualizado(s)`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} logger(s) fallaron al actualizar`);
      }

      setChanges({});
      setShowConfigDialog(false);
    } catch (error) {
      console.error('Error al aplicar cambios:', error);
      toast.error('Error al aplicar cambios');
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  const levels: LogLevel[] = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

  if (!content) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-utec-cyan" />
            Visor de Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay logs disponibles. Asegúrate de que el endpoint <code className="text-xs bg-gray-100 px-2 py-1 rounded">/actuator/logfile</code> esté habilitado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-utec-cyan" />
          Visor de Logs
          <Badge variant="secondary" className="ml-auto">
            {filteredLines.length} líneas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filtro de nivel */}
          <div className="flex gap-1 p-1 border rounded-lg bg-gray-50">
            {levels.map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  levelFilter === level
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Botones de acción */}
          {loggers && onLoggerUpdate && (
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-purple-600 text-white hover:bg-purple-700 border-purple-600 transition-all shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Configurar</span>
                </button>
              </DialogTrigger>
            </Dialog>
          )}

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              autoScroll
                ? 'bg-utec-blue text-white border-utec-blue'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
          >
            <ArrowDown className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Auto-scroll</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 border-gray-200 transition-all"
          >
            <Copy className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Copiar</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-utec-green text-white hover:bg-utec-green/90 border-utec-green transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Descargar</span>
          </button>
        </div>

        {/* Visor de logs */}
        <div className="border rounded-lg overflow-hidden bg-gray-900">
          <ScrollArea className="h-[400px]" ref={scrollRef}>
            <div className="p-4">
              {filteredLines.map((line, index) => (
                <div
                  key={`${index}-${line.slice(0, 32)}`}
                  className={`log-line py-0.5 px-2 rounded ${getLineClass(line)}`}
                >
                  <span className="text-gray-500 select-none inline-block w-12 text-right mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-100 font-mono text-xs whitespace-pre-wrap break-all">
                    {highlightText(line, searchTerm)}
                  </span>
                </div>
              ))}
              {filteredLines.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron líneas que coincidan con los filtros
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <p className="text-xs text-muted-foreground">
          Mostrando últimas {maxLines} líneas del log. {filteredLines.length} líneas después de filtrar.
        </p>
      </CardContent>

      {/* Dialog de Configuración de Loggers */}
      {loggers && onLoggerUpdate && (
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-3xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col"
          >
            <DialogHeader className="px-6 pt-5 pb-4 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base font-semibold">
                    Configuración de Loggers
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    Configura los niveles de log. Los cambios son temporales y se perderán al reiniciar.
                  </DialogDescription>
                </div>
                {hasChanges && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0">
                    {Object.keys(changes).length} cambios pendientes
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar logger por paquete o clase..."
                    value={loggerSearchTerm}
                    onChange={(e) => setLoggerSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>

                {/* Filtros: 3 columnas iguales + botón limpiar al lado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label htmlFor="log-level-filter" className="text-xs text-muted-foreground">
                      Nivel
                    </label>
                    <Select value={loggerLevelFilter} onValueChange={setLoggerLevelFilter}>
                      <SelectTrigger id="log-level-filter" className="w-full h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos los niveles</SelectItem>
                        {LOG_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="log-package-filter" className="text-xs text-muted-foreground">
                      Paquete
                    </label>
                    <Select value={loggerPackageFilter} onValueChange={setLoggerPackageFilter}>
                      <SelectTrigger id="log-package-filter" className="w-full h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos los paquetes</SelectItem>
                        {uniquePackages.map((pkg) => (
                          <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 h-9 px-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showOnlyModified}
                      onChange={(e) => setShowOnlyModified(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Solo modificados</span>
                  </label>
                </div>

                {(loggerSearchTerm || loggerLevelFilter !== 'ALL' || loggerPackageFilter !== 'ALL' || showOnlyModified) && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Mostrando {filteredLoggers.length} de {loggersArray.length} loggers
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLoggerSearchTerm('');
                        setLoggerLevelFilter('ALL');
                        setLoggerPackageFilter('ALL');
                        setShowOnlyModified(false);
                      }}
                      className="text-foreground hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}

                {hasChanges && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Los cambios son <strong>temporales</strong> y se perderán al reiniciar el servidor.
                    </p>
                  </div>
                )}

                {/* Lista de loggers */}
                <div className="space-y-1.5">
                  {filteredLoggers.length > 0 ? (
                    filteredLoggers.map((logger) => {
                      const pendingLevel = changes[logger.name];
                      const currentLevel = logger.configuredLevel || logger.effectiveLevel;
                      const hasChange = pendingLevel && pendingLevel !== currentLevel;

                      return (
                        <div
                          key={logger.name}
                          className={`flex items-center gap-3 p-2.5 border rounded-md transition-colors ${
                            hasChange ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-muted/30'
                          }`}
                        >
                          <p
                            className="font-mono text-xs text-foreground flex-1 min-w-0 truncate"
                            title={logger.name}
                          >
                            {logger.name}
                          </p>
                          <span
                            className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-md border whitespace-nowrap flex-shrink-0 ${getLevelColor(currentLevel)}`}
                          >
                            {currentLevel}
                          </span>
                          {hasChange && <span className="text-amber-600 flex-shrink-0">→</span>}
                          <Select
                            value={pendingLevel || currentLevel}
                            onValueChange={(value) => handleLevelChange(logger.name, value)}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs flex-shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LOG_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
                      <p className="font-medium">No se encontraron loggers</p>
                      <p className="text-xs mt-1">
                        {loggerSearchTerm || loggerLevelFilter !== 'ALL' || loggerPackageFilter !== 'ALL' || showOnlyModified
                          ? 'Intenta ajustar o limpiar los filtros'
                          : 'No hay loggers disponibles'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="px-6 py-3 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cerrar
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={!hasChanges || saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-200 disabled:text-muted-foreground"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Guardar cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog de confirmación */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aplicar cambios en loggers?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el nivel de {Object.keys(changes).length} logger(s).
              Estos cambios son temporales y se perderán cuando reinicies el servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyChanges} disabled={saving}>
              {saving ? 'Guardando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

