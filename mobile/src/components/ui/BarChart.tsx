import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, utec, themed } from '../../theme';
import { Text } from './Text';

export type BarDatum = {
  label: string;
  value: number;
  /** Texto a mostrar a la derecha; por defecto el valor. */
  display?: string;
  color?: string;
};

export type BarChartProps = {
  data: BarDatum[];
  /** Valor máximo para la escala; por defecto el mayor de los datos. */
  max?: number;
};

/** Gráfico de barras horizontales liviano (sin SVG, basado en Views). */
export function BarChart({ data, max }: BarChartProps) {
  const maxValue = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.wrap}>
      {data.map((d, i) => {
        const pct = Math.max(0, Math.min(1, d.value / maxValue));
        return (
          <View key={`${d.label}-${i}`} style={styles.row}>
            <View style={styles.labelRow}>
              <Text size="xs" numberOfLines={1} style={styles.label}>
                {d.label}
              </Text>
              <Text size="xs" weight="semibold">
                {d.display ?? String(d.value)}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${pct * 100}%`, backgroundColor: d.color ?? utec.blue },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  wrap: { gap: spacing[3] },
  row: { gap: spacing[1.5] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  label: { flex: 1, color: colors.foreground },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: radius.full },
}));
