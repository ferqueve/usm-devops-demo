import { usuariosApi } from '@/lib/api/users';
import type { UserFilters } from '@/lib/types/users';
import type { InventarioItem, Espacio } from '@/lib/types/spaces';
import { formatDateOnly } from './timezone';
import { buildAndDownloadCsv, csvEscape, downloadBlob, todayIsoDate } from './csv-helpers';

/**
 * Exporta usuarios a CSV y descarga el archivo
 */
export async function exportUsersToCSV(filters?: UserFilters): Promise<void> {
  try {
    const blob = await usuariosApi.exportarUsuarios(filters);
    downloadBlob(blob, `usuarios_${todayIsoDate()}.csv`);
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
    const headers = [
      'ID',
      'Espacio',
      'Tipo Elemento',
      'Cantidad',
      'Estado',
      'Observaciones',
    ];

    const rows = items.map((item) => [
      item.id,
      item.espacioNombre || 'Sin asignar',
      item.tipoElementoNombre,
      item.cantidad,
      item.estado,
      csvEscape(item.observaciones ?? ''),
    ]);

    buildAndDownloadCsv(headers, rows, `inventario_${todayIsoDate()}.csv`);
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
    const headers = [
      'ID',
      'Nombre',
      'Capacidad',
      'Tipo de Espacio',
      'Activo',
      'Fecha de Creación',
      'Fecha de Actualización',
    ];

    const rows = espacios.map((espacio) => [
      espacio.id,
      csvEscape(espacio.nombre),
      espacio.capacidad,
      espacio.tipoEspacioNombre || 'Sin tipo',
      espacio.activo ? 'Sí' : 'No',
      formatDateOnly(espacio.createdAt),
      formatDateOnly(espacio.updatedAt),
    ]);

    buildAndDownloadCsv(headers, rows, `espacios_${todayIsoDate()}.csv`);
  } catch (error) {
    console.error('Error al exportar espacios:', error);
    throw new Error('Error al exportar espacios. Intenta nuevamente.');
  }
}
