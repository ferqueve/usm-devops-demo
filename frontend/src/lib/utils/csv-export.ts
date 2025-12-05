import { usuariosApi } from '@/lib/api/users';
import type { UserFilters } from '@/lib/types/users';
import type { InventarioItem, Espacio } from '@/lib/types/spaces';
import { formatDateOnly } from './timezone';

/**
 * Exporta usuarios a CSV y descarga el archivo
 */
export async function exportUsersToCSV(filters?: UserFilters): Promise<void> {
  try {
    const blob = await usuariosApi.exportarUsuarios(filters);
    
    // Crear URL del blob
    const url = globalThis.URL.createObjectURL(blob);
    
    // Crear elemento anchor temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    
    // Generar nombre de archivo con fecha actual
    const today = new Date().toISOString().split('T')[0];
    link.download = `usuarios_${today}.csv`;
    
    // Añadir al DOM temporalmente y hacer clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    throw new Error('Error al exportar usuarios. Intenta nuevamente.');
  }
}

/**
 * Exporta inventario a CSV y descarga el archivo
 */
export function exportInventarioToCSV(items: InventarioItem[]): void {
  try {
    // Definir encabezados
    const headers = [
      'ID',
      'Espacio',
      'Tipo Elemento',
      'Cantidad',
      'Estado',
      'Observaciones'
    ];
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.id,
        item.espacioNombre || 'Sin asignar',
        item.tipoElementoNombre,
        item.cantidad,
        item.estado,
        `"${(item.observaciones || '').replaceAll('"', '""')}"`
      ].join(','))
    ].join('\n');
    
    // Crear blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear URL del blob
    const url = globalThis.URL.createObjectURL(blob);
    
    // Crear elemento anchor temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    
    // Generar nombre de archivo con fecha actual
    const today = new Date().toISOString().split('T')[0];
    link.download = `inventario_${today}.csv`;
    
    // Añadir al DOM temporalmente y hacer clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error al exportar inventario:', error);
    throw new Error('Error al exportar inventario. Intenta nuevamente.');
  }
}

/**
 * Exporta espacios a CSV y descarga el archivo
 */
export function exportEspaciosToCSV(espacios: Espacio[]): void {
  try {
    // Definir encabezados
    const headers = [
      'ID',
      'Nombre',
      'Capacidad',
      'Tipo de Espacio',
      'Activo',
      'Fecha de Creación',
      'Fecha de Actualización'
    ];
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...espacios.map(espacio => [
        espacio.id,
        `"${espacio.nombre.replaceAll('"', '""')}"`,
        espacio.capacidad,
        espacio.tipoEspacioNombre || 'Sin tipo',
        espacio.activo ? 'Sí' : 'No',
        formatDateOnly(espacio.createdAt),
        formatDateOnly(espacio.updatedAt)
      ].join(','))
    ].join('\n');
    
    // Crear blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear URL del blob
    const url = globalThis.URL.createObjectURL(blob);
    
    // Crear elemento anchor temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    
    // Generar nombre de archivo con fecha actual
    const today = new Date().toISOString().split('T')[0];
    link.download = `espacios_${today}.csv`;
    
    // Añadir al DOM temporalmente y hacer clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error al exportar espacios:', error);
    throw new Error('Error al exportar espacios. Intenta nuevamente.');
  }
}
