import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Moon, Sun, User } from 'lucide-react-native';
import { colors, radius, spacing, utec, themed, useTheme } from '../theme';
import { Text } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { navItemsForRole } from '../lib/permissions';
import { rolLabel } from '../lib/format';
import { NAV_ICONS } from './icons';

const logo = require('../../assets/logo-utec.png');

export function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { mode, toggle } = useTheme();
  if (!user) return null;

  const items = navItemsForRole(user.rol);
  const activeRoute = props.state.routeNames[props.state.index];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header: logo UTEC | USM */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={styles.divider} />
        <Text utec size="lg" color="#FFFFFF">
          USM
        </Text>
      </View>

      {/* Menú */}
      <ScrollView contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const isActive = activeRoute === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => props.navigation.navigate(item.id)}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.itemActive,
                pressed && !isActive && styles.itemPressed,
              ]}
            >
              <Icon
                size={18}
                color={isActive ? colors.sidebarItemActiveText : colors.sidebarItem}
              />
              <Text
                weight="medium"
                size="sm"
                color={isActive ? colors.sidebarItemActiveText : colors.sidebarItem}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Perfil */}
      <View style={styles.profile}>
        <View style={styles.profileTop}>
          <LinearGradient
            colors={[utec.blue, utec.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <User size={14} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.roleBadge}>
            <Text size="xs" weight="medium" color="#E5E7EB">
              {rolLabel(user.rol)}
            </Text>
          </View>
          <Pressable style={styles.settingsBtn} hitSlop={8} onPress={toggle}>
            {mode === 'dark' ? (
              <Sun size={18} color="#FBBF24" />
            ) : (
              <Moon size={18} color="#9CA3AF" />
            )}
          </Pressable>
        </View>
        <Text weight="semibold" size="sm" color="#FFFFFF" numberOfLines={2}>
          {user.nombre}
        </Text>
        <Text size="xs" color="#9CA3AF" numberOfLines={1}>
          {user.email}
        </Text>
      </View>

      {/* Footer: Cerrar Sesión */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[3] }]}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.item, pressed && styles.logoutPressed]}
        >
          <LogOut size={18} color={colors.sidebarItem} />
          <Text weight="medium" size="sm" color={colors.sidebarItem}>
            Cerrar Sesión
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: utec.dark },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logo: { height: 40, width: 90 },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
  menu: { paddingTop: spacing[5], paddingHorizontal: spacing[2], gap: spacing[1] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.sm,
  },
  itemActive: { backgroundColor: colors.sidebarItemActiveBg },
  itemPressed: { backgroundColor: utec.darkLighter },
  logoutPressed: { backgroundColor: 'rgba(223,43,49,0.18)' },
  profile: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    gap: spacing[0.5],
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    backgroundColor: '#374151',
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  settingsBtn: { marginLeft: 'auto', padding: spacing[1.5] },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing[2],
    paddingTop: spacing[3],
  },
}));
