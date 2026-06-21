import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, type ParamListBase } from '@react-navigation/native';
import type { DrawerHeaderProps } from '@react-navigation/drawer';
import { Clock, Menu } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../theme';
import { Text } from '../components/ui';
import { formatHora } from '../lib/format';

const TITLES: Record<string, string> = {
  Dashboard: 'Dashboard',
  Calendario: 'Calendario',
  Reservas: 'Reservas',
  Espacios: 'Gestión de Espacios',
  Inventario: 'Inventario',
  Estadisticas: 'Estadísticas',
  Asistente: 'Asistente IA',
  Usuarios: 'Usuarios',
  Sistema: 'Sistema',
  Auditoria: 'Auditoría',
};

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return formatHora(now);
}

export function AppHeader({ navigation, route }: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const time = useClock();
  const title = TITLES[route.name] ?? route.name;

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          hitSlop={10}
          style={styles.menuBtn}
        >
          <Menu size={22} color={colors.foreground} />
        </Pressable>
        <Text utec size="xl" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.timeBadge}>
          <Clock size={12} color="#FFFFFF" />
          <Text size="xs" weight="medium" color="#FFFFFF">
            {time}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Tipado laxo para que el navigator no exija ParamList completo.
export type _AppHeaderRoute = ParamListBase;

const styles = themed((colors) => StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  menuBtn: { padding: spacing[1] },
  title: { flex: 1 },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: utec.dark,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
}));
