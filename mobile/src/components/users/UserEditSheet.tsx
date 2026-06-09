import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, spacing, themed } from '../../theme';
import { AvatarInitials, Button, SelectField, Text } from '../ui';
import { usersApi } from '../../lib/api';
import type { Usuario, UserRole } from '../../lib/types';
import { rolLabel } from '../../lib/format';

export type UserEditSheetProps = {
  user: Usuario | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const ROLES: UserRole[] = ['ADMIN', 'ANALISTA', 'DOCENTE', 'ESTUDIANTE', 'EXTERNO', 'MANTENIMIENTO'];

export function UserEditSheet({ user, visible, onClose, onSaved }: UserEditSheetProps) {
  const insets = useSafeAreaInsets();
  const [rol, setRol] = useState<UserRole>('ESTUDIANTE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setRol(user.rolApp);
    setError(null);
    setSaving(false);
  }, [user, visible]);

  if (!user) return null;

  const save = async () => {
    if (rol === user.rolApp) return onClose();
    setSaving(true);
    setError(null);
    try {
      await usersApi.cambiarRol(user.id, rol);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el rol.');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AvatarInitials name={user.nombre} seed={user.email} size={40} />
            <View style={styles.flex}>
              <Text weight="semibold" size="sm" numberOfLines={1}>
                {user.nombre}
              </Text>
              <Text size="xs" muted numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <SelectField
              label="Rol"
              value={rol}
              onChange={setRol}
              options={ROLES.map((r) => ({ label: rolLabel(r), value: r }))}
            />
            {error ? (
              <Text size="sm" color={colors.destructive}>
                {error}
              </Text>
            ) : null}
            <Button title="Guardar" loading={saving} fullWidth onPress={save} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = themed((colors) => StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTouch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing[3],
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  body: { marginTop: spacing[4], gap: spacing[4] },
}));
