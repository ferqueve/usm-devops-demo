import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, fonts, fontSize, radius, spacing, themed } from '../../theme';
import { Text } from './Text';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

export type BadgeProps = {
  label: string;
  variant?: Variant;
  /** Color de fondo sólido custom (con texto blanco), ej. color de tipo de espacio. */
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  leading?: React.ReactNode;
};

export function Badge({ label, variant = 'default', color, textColor, style, leading }: BadgeProps) {
  const bg =
    color ??
    (variant === 'default'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'destructive'
          ? colors.destructive
          : 'transparent');
  const fg =
    textColor ??
    (color
      ? '#FFFFFF'
      : variant === 'secondary'
        ? colors.secondaryForeground
        : variant === 'outline'
          ? colors.foreground
          : '#FFFFFF');

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {leading}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
  },
}));
