import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, themed } from '../../theme';
import { Text } from './Text';

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text weight="semibold" size="lg" style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text muted size="sm" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = themed((colors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  center: { textAlign: 'center' },
  action: { marginTop: spacing[3] },
}));
