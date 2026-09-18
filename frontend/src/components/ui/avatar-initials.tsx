import { cn } from '@/lib/utils/helpers';

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
export function AvatarInitials({ name, email, size = 'md', className }: Readonly<AvatarInitialsProps>) {
  // Obtener iniciales (primera letra de nombre y apellido)
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return email ? email[0].toUpperCase() : '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
  };

  // Generar color basado en el nombre (consistente).
  // Solo usamos clases planas porque las variantes gradientes con custom colors
  // (from-utec-blue, etc.) no están registradas en Tailwind y caían a sin color.
  const getColorFromName = (str: string): string => {
    const colors = [
      'bg-utec-blue text-white',
      'bg-utec-green text-marca-tinta',
      'bg-utec-cyan text-marca-tinta',
      'bg-utec-orange text-marca-tinta',
      'bg-utec-red text-white',
      'bg-chrome text-white',
      'bg-info text-white',
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.codePointAt(i)! + ((hash << 5) - hash);
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

