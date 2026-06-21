import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, fontSize, radius, spacing, themed } from '../../theme';
import { Text } from './Text';

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Icono opcional a la izquierda del texto. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const sizeStyle: Record<Size, ViewStyle> = {
  default: { height: 40, paddingHorizontal: spacing[4] },
  sm: { height: 34, paddingHorizontal: spacing[3] },
  lg: { height: 44, paddingHorizontal: spacing[5] },
  icon: { height: 40, width: 40 },
};

export function Button({
  title,
  variant = 'default',
  size = 'default',
  loading,
  icon,
  fullWidth,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  // Mapas de color dentro del render para seguir el tema activo (Proxy `colors`).
  const bg: Record<Variant, string> = {
    default: colors.primary,
    destructive: colors.destructive,
    outline: colors.background,
    secondary: colors.secondary,
    ghost: 'transparent',
    link: 'transparent',
  };
  const fg: Record<Variant, string> = {
    default: colors.primaryForeground,
    destructive: colors.destructiveForeground,
    outline: colors.foreground,
    secondary: colors.secondaryForeground,
    ghost: colors.foreground,
    link: colors.primary,
  };
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle[size],
        { backgroundColor: bg[variant] },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border },
        fullWidth && { alignSelf: 'stretch' },
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {icon}
          {title ? (
            <Text
              style={[
                styles.label,
                {
                  color: fg[variant],
                  textDecorationLine: variant === 'link' ? 'underline' : 'none',
                },
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = themed((colors) => StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
  },
}));
