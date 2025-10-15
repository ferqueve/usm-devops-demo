import { cn } from '@/core/utils/helpers';

interface AvatarInitialsProps {
  name: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Avatar component que muestra las iniciales del usuario
 * con colores basados en el hash del nombre para consistencia
 */
export function AvatarInitials({ name, email, size = 'md', className }: AvatarInitialsProps) {
  // Obtener iniciales (primera letra de nombre y apellido)
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return email ? email[0].toUpperCase() : '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generar color basado en el nombre (consistente)
  const getColorFromName = (str: string): string => {
    const colors = [
      'bg-utec-blue text-white',
      'bg-utec-green text-white',
      'bg-utec-cyan text-white',
      'bg-utec-orange text-white',
      'bg-gradient-to-br from-utec-blue to-utec-cyan text-white',
      'bg-gradient-to-br from-utec-green to-utec-blue text-white',
      'bg-gradient-to-br from-utec-orange to-utec-red text-white',
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold shadow-sm transition-transform hover:scale-105',
        sizeClasses[size],
        colorClass,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

