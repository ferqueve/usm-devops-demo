import { StyleSheet, View, type ViewStyle } from 'react-native';
import { radius, shadow, spacing, themed } from '../../theme';
import { Text } from './Text';

export type MetricCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  /** Color de fondo sólido (paleta UTEC). */
  color: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

/** Card de métrica con color sólido y texto blanco (como el dashboard del web). */
export function MetricCard({ label, value, sub, color, icon, style }: MetricCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: color }, style]}>
      <View style={styles.top}>
        <Text size="xs" weight="medium" color="rgba(255,255,255,0.85)" numberOfLines={1}>
          {label}
        </Text>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
      </View>
      <Text weight="bold" size="3xl" color="#FFFFFF">
        {value}
      </Text>
      {sub ? (
        <Text size="xs" color="rgba(255,255,255,0.85)" numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderRadius: radius.lg,
    padding: spacing[3],
    gap: spacing[0.5],
    ...shadow.card,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: { opacity: 0.9 },
}));
