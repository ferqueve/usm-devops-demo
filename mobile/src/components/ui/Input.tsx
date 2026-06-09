import { useState } from 'react';
import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
import { colors, fonts, fontSize, radius, spacing, themed } from '../../theme';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label?: string;
  /** Slot a la derecha (ej. botón mostrar/ocultar contraseña). */
  rightSlot?: React.ReactNode;
};

/** Input shadcn: h-9, border, rounded-md, focus ring. */
export function Input({ label, rightSlot, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text weight="medium" size="sm" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          { borderColor: focused ? colors.ring : colors.input },
          focused && styles.focused,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightSlot}
      </View>
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  wrap: { gap: spacing[1.5] },
  label: { color: colors.foreground },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[3],
  },
  focused: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.foreground,
    paddingVertical: 0,
  },
}));
