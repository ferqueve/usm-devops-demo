import { Pressable, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { radius, shadow, spacing, utec, themed } from '../../theme';

export type FabProps = {
  onPress: () => void;
  icon?: React.ReactNode;
  color?: string;
};

/** Botón de acción flotante (bottom-right). */
export function Fab({ onPress, icon, color = utec.blue }: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: color }, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {icon ?? <Plus size={24} color="#FFFFFF" />}
    </Pressable>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[6],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  pressed: { opacity: 0.85 },
}));
