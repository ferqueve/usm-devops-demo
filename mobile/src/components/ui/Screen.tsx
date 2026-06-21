import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing, utec, themed } from '../../theme';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Contenedor base de pantalla: fondo, scroll opcional, estados loading/error. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  loading,
  error,
  onRetry,
  refreshing,
  onRefresh,
}: ScreenProps) {
  if (loading) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator size="large" color={utec.blue} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.fill, styles.center]}>
        <EmptyState
          title="Algo salió mal"
          description={error}
          action={onRetry ? <Button title="Reintentar" variant="outline" onPress={onRetry} /> : undefined}
        />
      </View>
    );
  }

  if (!scroll) {
    return <View style={[styles.fill, padded && styles.padded]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[padded && styles.padded, styles.grow]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={utec.blue} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.secondary },
  grow: { flexGrow: 1 },
  padded: { padding: spacing[4], gap: spacing[4] },
  center: { alignItems: 'center', justifyContent: 'center' },
}));
