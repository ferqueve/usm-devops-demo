import { usuariosApi } from '@/lib/api/users';
import type { UserFilters } from '@/lib/types/users';

/**
 * Exporta usuarios a CSV y descarga el archivo
 */
export async function exportUsersToCSV(filters?: UserFilters): Promise<void> {
  try {
    const blob = await usuariosApi.exportarUsuarios(filters);
    
    // Crear URL del blob
    const url = window.URL.createObjectURL(blob);
    
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
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    throw new Error('Error al exportar usuarios. Intenta nuevamente.');
  }
}
