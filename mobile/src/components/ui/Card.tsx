import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radius, shadow, spacing, themed } from '../../theme';
import { Text } from './Text';

/** Card base (shadcn: bg-card rounded-xl border shadow-sm). */
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text weight="semibold" size="lg">
      {children}
    </Text>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return (
    <Text muted size="sm">
      {children}
    </Text>
  );
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props} />;
}

const styles = themed((colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[1],
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
}));
