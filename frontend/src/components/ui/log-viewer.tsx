import { useState, useMemo, useRef, useEffect } from 'react';
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
  /** Vuelve a pedir el archivo de log. Habilita el modo "seguir en vivo". */
  onRefresh?: () => void | Promise<void>;
}

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'ALL';

const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'OFF'];

export function LogViewer({ content, maxLines = 1000, loggers, onLoggerUpdate, onRefresh }: Readonly<LogViewerProps>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [autoScroll, setAutoScroll] = useState(false);
  // "Seguir en vivo": recarga el archivo cada 5s y baja solo. Sin esto el visor
  // muestra la foto del momento en que se abrió la vista.
  const [siguiendo, setSiguiendo] = useState(false);
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

  // Cuántas líneas hay de cada nivel: los chips sin número obligan a probar
  // uno por uno para descubrir que no hay ningún ERROR.
  const conteoPorNivel = useMemo(() => {
    const conteo: Record<string, number> = { ALL: lines.length, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0 };
    for (const line of lines) {
      const nivel = detectLogLevel(line);
      if (nivel !== 'ALL') conteo[nivel] += 1;
    }
    return conteo;
  }, [lines]);

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
    if ((autoScroll || siguiendo) && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLines, autoScroll, siguiendo]);

  useEffect(() => {
    if (!siguiendo || !onRefresh) return;
    const id = setInterval(() => { void onRefresh(); }, 5000);
    return () => clearInterval(id);
  }, [siguiendo, onRefresh]);

  // Resaltar términos de búsqueda
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={`${part}-${i}`} className="bg-warning-suave text-foreground">{part}</mark>
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
      TRACE: 'bg-muted text-foreground border-border',
      DEBUG: 'bg-info-suave text-info-texto border-info-borde',
      INFO: 'bg-success-suave text-success-texto border-success-borde',
      WARN: 'bg-warning-suave text-warning-texto border-warning-borde',
      ERROR: 'bg-danger-suave text-danger-texto border-danger-borde',
      OFF: 'bg-muted text-foreground border-border',
    };
    return colors[level] || 'bg-muted text-foreground border-border';
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
      <div className="border rounded-lg overflow-hidden shadow-card">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-chrome text-white border-b border-white/10">
          <FileText className="h-4 w-4 text-utec-cyan shrink-0" />
          <h3 className="text-sm font-semibold flex-1">Visor de Logs</h3>
        </div>
        <p className="text-muted-foreground text-center py-8 bg-card">
          No hay logs disponibles. Asegúrate de que el endpoint <code className="text-xs bg-muted px-2 py-1 rounded">/actuator/logfile</code> esté habilitado.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-card">
      <div className="bg-chrome text-white">
        {/* Fila 1: título + count + botones de acción */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <FileText className="h-4 w-4 text-utec-cyan shrink-0" />
          <h3 className="text-sm font-semibold flex-1">Visor de Logs</h3>
          <span className="text-xs text-white/70 tabular-nums mr-2">{filteredLines.length} líneas</span>

          {loggers && onLoggerUpdate && (
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <button
                  title="Configurar loggers"
                  className="flex items-center justify-center h-7 w-7 rounded-md text-white/80 hover:bg-white/10 transition"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </DialogTrigger>
            </Dialog>
          )}

          {onRefresh && (
            <button
              onClick={() => setSiguiendo(!siguiendo)}
              title={siguiendo ? 'Dejar de seguir el log' : 'Seguir el log en vivo'}
              className={`flex items-center gap-1.5 h-7 rounded-md px-2 text-[11px] font-medium transition ${
                siguiendo
                  ? 'bg-utec-green/25 text-utec-green'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${siguiendo ? 'animate-pulse bg-utec-green' : 'bg-white/40'}`} />
              {siguiendo ? 'En vivo' : 'Seguir'}
            </button>
          )}

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll"
            className={`flex items-center justify-center h-7 w-7 rounded-md transition ${
              autoScroll
                ? 'bg-utec-blue/30 text-utec-blue'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <ArrowDown className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopy}
            title="Copiar"
            className="flex items-center justify-center h-7 w-7 rounded-md text-white/80 hover:bg-white/10 transition"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={handleDownload}
            title="Descargar"
            className="flex items-center justify-center h-7 w-7 rounded-md text-utec-green hover:bg-white/10 transition"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Fila 2: search + chips de nivel */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/10">
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
            <Input
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 bg-white/5 border-white/15 text-white text-xs placeholder:text-white/40 focus-visible:ring-white/30"
            />
          </div>
          <div className="flex gap-0.5 p-0.5 rounded-md bg-white/5 border border-white/10">
            {levels.map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                disabled={conteoPorNivel[level] === 0}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition disabled:cursor-default disabled:opacity-40 ${
                  levelFilter === level
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {level}
                <span className="ml-1 tabular-nums font-normal opacity-70">{conteoPorNivel[level] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visor de logs */}
      <div className="bg-chrome">
        <ScrollArea className="h-[400px]" ref={scrollRef}>
          <div className="p-4">
            {filteredLines.map((line, index) => (
              <div
                key={`${index}-${line.slice(0, 32)}`}
                className={`log-line py-0.5 px-2 rounded ${getLineClass(line)}`}
              >
                <span className="text-muted-foreground select-none inline-block w-12 text-right mr-3">
                  {index + 1}
                </span>
                <span className="text-foreground font-mono text-xs whitespace-pre-wrap break-all">
                  {highlightText(line, searchTerm)}
                </span>
              </div>
            ))}
            {filteredLines.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron líneas que coincidan con los filtros
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <p className="text-xs text-muted-foreground bg-card px-4 py-2">
        Mostrando últimas {maxLines} líneas del log. {filteredLines.length} líneas después de filtrar.
      </p>

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
                  <Badge variant="outline" className="bg-warning-suave text-warning-texto border-warning-borde flex-shrink-0">
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
                      className="w-4 h-4 rounded border-border"
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
                  <div className="flex items-start gap-2 p-3 bg-warning-suave border border-warning-borde rounded-md text-xs text-warning-texto">
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
                            hasChange ? 'bg-warning-suave border-warning-borde' : 'bg-card border-border hover:bg-muted/30'
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
                          {hasChange && <span className="text-warning-texto flex-shrink-0">→</span>}
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
                className="bg-success hover:bg-success text-white disabled:bg-secondary disabled:text-muted-foreground"
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
    </div>
  );
}

