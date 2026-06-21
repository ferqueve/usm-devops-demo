import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { fonts, fontSize, useColors, themed } from '../../theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Size = keyof typeof fontSize;

export type TextProps = RNTextProps & {
  weight?: Weight;
  size?: Size;
  color?: string;
  /** Fuente corporativa UTEC (mayúsculas + tracking), para títulos de marca. */
  utec?: boolean;
  muted?: boolean;
};

const weightToFont: Record<Weight, string> = {
  regular: fonts.regular,
  medium: fonts.medium,
  semibold: fonts.semibold,
  bold: fonts.bold,
};

/** Texto temático: aplica la familia Poppins (o UTEC) por defecto. */
export function Text({
  weight = 'regular',
  size = 'base',
  color,
  utec,
  muted,
  style,
  ...props
}: TextProps) {
  const colors = useColors();
  return (
    <RNText
      style={[
        {
          fontFamily: utec ? fonts.utec : weightToFont[weight],
          fontSize: fontSize[size],
          color: color ?? (muted ? colors.mutedForeground : colors.foreground),
        },
        utec && styles.utec,
        style,
      ]}
      {...props}
    />
  );
}

const styles = themed((colors) => StyleSheet.create({
  utec: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
}));
