import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, ArrowUpDown, ArrowUp, ArrowDown, BookOpen, FileJson } from 'lucide-react';
import type { MappingContext, DispatcherMapping, MappingsInfo } from '@/lib/types/actuator';

interface EndpointsSectionProps {
  mappings: MappingsInfo | null | undefined;
}

export const EndpointsSection = memo(function EndpointsSection({ mappings }: EndpointsSectionProps) {
  // Estado para ordenamiento
  const [sortColumn, setSortColumn] = useState<'method' | 'path'>('path');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Mapeo de paths a descripciones (extraído de las anotaciones @Operation del backend)
  const endpointDescriptions: Record<string, string> = {
    // Autenticación
    '/api/v1/auth/login': 'Iniciar sesión',
    '/api/v1/auth/register': 'Registrar usuario',
    '/api/v1/auth/logout': 'Cerrar sesión',
    '/api/v1/auth/refresh': 'Refrescar token',
    '/api/v1/auth/verify': 'Verificar token',
    '/api/v1/auth/verify-email': 'Verificar email',
    '/api/v1/auth/resend-verification': 'Reenviar código de verificación',
    // OAuth2
    '/api/v1/oauth2/google/authorize': 'Autorizar con Google',
    '/api/v1/oauth2/google/callback': 'Callback de Google',
    '/api/v1/oauth2/google/info': 'Información OAuth',
    // Usuarios
    '/api/v1/usuarios/me': 'Obtener mi perfil',
    '/api/v1/usuarios': 'Listar usuarios',
    '/api/v1/usuarios/{id}': 'Obtener usuario por ID',
    '/api/v1/usuarios/{id}/rol': 'Cambiar rol de usuario',
    '/api/v1/usuarios/{id}/toggle-activo': 'Activar/desactivar usuario',
    // Estadísticas
    '/api/v1/stats/active-users': 'Obtener usuarios activos',
  };

  // Función para manejar el ordenamiento
  const handleSort = (column: 'method' | 'path') => {
    if (sortColumn === column) {
      // Si es la misma columna, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es columna diferente, ordenar ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (column: 'method' | 'path') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Función para obtener el color del método HTTP
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-green-100 text-green-800 border-green-200',
      'POST': 'bg-blue-100 text-blue-800 border-blue-200',
      'PUT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PATCH': 'bg-orange-100 text-orange-800 border-orange-200',
      'DELETE': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Procesar todos los endpoints de todos los contextos (excluyendo actuator)
  const allEndpoints: Array<{ method: string; path: string; description: string }> = [];
  
  if (mappings?.contexts) {
    Object.values(mappings.contexts).forEach((context: MappingContext) => {
      const dispatcherMappings = context.mappings?.dispatcherServlets?.dispatcherServlet || [];
      dispatcherMappings.forEach((mapping: DispatcherMapping) => {
        const predicate = mapping.predicate || '';
        
        // Extraer método y path correctamente
        let method = 'GET';
        let path = '';
        
        // Formato: {GET [/api/v1/...]}
        const bracketMatch = /\[([^\]]+)\]/.exec(predicate);
        if (bracketMatch) {
          path = bracketMatch[1];
        }

        const methodMatch = /^(\{)?([A-Z]+)/.exec(predicate);
        if (methodMatch) {
          method = methodMatch[2];
        }
        
        const description = endpointDescriptions[path] || 'Endpoint de la API';
        
        // Solo mostrar endpoints de la API
        if (path.startsWith('/api/')) {
          allEndpoints.push({ method, path, description });
        }
      });
    });
    
    // Ordenar según columna y dirección seleccionadas
    allEndpoints.sort((a, b) => {
      let comparison = 0;
      
      if (sortColumn === 'method') {
        comparison = a.method.localeCompare(b.method);
      } else {
        comparison = a.path.localeCompare(b.path);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5 text-utec-purple" />
            Endpoints REST
            {allEndpoints.length > 0 && (
              <Badge variant="secondary">
                {allEndpoints.length} endpoints
              </Badge>
            )}
          </CardTitle>
          
          {/* Botones de Swagger (solo ADMIN) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}/swagger-ui.html`, '_blank')}
            >
              <BookOpen className="h-4 w-4" />
              Swagger UI
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}/v3/api-docs`, '_blank')}
            >
              <FileJson className="h-4 w-4" />
              OpenAPI JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {allEndpoints.length > 0 ? (
          <ScrollArea className="h-[500px] border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] w-[80px]">
                    <button
                      onClick={() => handleSort('method')}
                      className="flex items-center hover:text-white transition-colors duration-150 font-semibold"
                    >
                      Método
                      {getSortIcon('method')}
                    </button>
                  </TableHead>
                  <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db] w-[300px]">
                    <button
                      onClick={() => handleSort('path')}
                      className="flex items-center hover:text-white transition-colors duration-150 font-semibold"
                    >
                      Endpoint
                      {getSortIcon('path')}
                    </button>
                  </TableHead>
                  <TableHead style={{ backgroundColor: '#525961' }} className="h-10 text-[#d1d5db]">Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEndpoints.map((endpoint) => (
                  <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                    <TableCell className="py-2">
                      <Badge className={`text-xs font-semibold border ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs py-2">
                      {endpoint.path}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700 py-2">
                      {endpoint.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">
            No hay información de mappings disponible
          </p>
        )}
      </CardContent>
    </Card>
  );
});
