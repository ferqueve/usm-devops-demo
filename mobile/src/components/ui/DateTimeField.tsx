import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { colors, radius, spacing, themed } from '../../theme';
import { Text } from './Text';
import { formatFechaCorta, formatHora } from '../../lib/format';

export type DateTimeFieldProps = {
  label?: string;
  value: Date;
  mode: 'date' | 'time';
  minimumDate?: Date;
  onChange: (d: Date) => void;
};

export function DateTimeField({ label, value, mode, minimumDate, onChange }: DateTimeFieldProps) {
  const [show, setShow] = useState(false);

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    // En Android el picker se cierra solo; en iOS lo dejamos abierto hasta confirmar.
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selected) onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text weight="medium" size="sm" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        {mode === 'date' ? (
          <CalendarDays size={16} color={colors.mutedForeground} />
        ) : (
          <Clock size={16} color={colors.mutedForeground} />
        )}
        <Text size="base" style={styles.flex}>
          {mode === 'date' ? formatFechaCorta(value) : formatHora(value)}
        </Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          minimumDate={minimumDate}
          onChange={handle}
        />
      ) : null}
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  wrap: { gap: spacing[1.5], flex: 1 },
  label: { color: colors.foreground },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[3],
  },
}));
