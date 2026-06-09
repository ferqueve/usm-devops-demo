import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { colors, radius, spacing, themed } from '../../theme';
import { Text } from './Text';

export type SelectOption<T> = { label: string; value: T; sublabel?: string };

export type SelectFieldProps<T> = {
  label?: string;
  placeholder?: string;
  value: T | null | undefined;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  title?: string;
};

export function SelectField<T extends string | number>({
  label,
  placeholder = 'Seleccionar…',
  value,
  options,
  onChange,
  title,
}: SelectFieldProps<T>) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text weight="medium" size="sm" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text size="base" color={selected ? colors.foreground : colors.mutedForeground} numberOfLines={1} style={styles.flex}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTouch} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text weight="bold" size="md" style={styles.flex}>
                {title ?? label ?? 'Seleccionar'}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.list}>
              {options.map((o) => {
                const isSel = o.value === value;
                return (
                  <Pressable
                    key={String(o.value)}
                    style={styles.option}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.flex}>
                      <Text size="sm" weight={isSel ? 'semibold' : 'regular'}>
                        {o.label}
                      </Text>
                      {o.sublabel ? (
                        <Text size="xs" muted>
                          {o.sublabel}
                        </Text>
                      ) : null}
                    </View>
                    {isSel ? <Check size={18} color={colors.foreground} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  wrap: { gap: spacing[1.5] },
  label: { color: colors.foreground },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[3],
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTouch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing[3],
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
  list: {},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
}));
