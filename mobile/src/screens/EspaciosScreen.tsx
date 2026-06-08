import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Pressable, Alert,
} from 'react-native';
import { fetchEspacios, logout } from '../api';
import { Espacio } from '../types';

type Props = { nombre: string; onLogout: () => void };

export default function EspaciosScreen({ nombre, onLogout }: Props) {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchEspacios();
      setEspacios(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudieron cargar los espacios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Hola, {nombre}</Text>
          <Text style={styles.count}>{espacios.length} espacios</Text>
        </View>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logout}>Salir</Text>
        </Pressable>
      </View>

      <FlatList
        data={espacios}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View
              style={[
                styles.colorBar,
                { backgroundColor: item.tipoEspacioColor || '#2563eb' },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.nombre}</Text>
              <Text style={styles.meta}>
                {item.tipoEspacioNombre ?? 'Espacio'} · cap. {item.capacidad}
              </Text>
              {item.edificioNombre && (
                <Text style={styles.meta}>📍 {item.edificioNombre}</Text>
              )}
            </View>
            <Text
              style={[
                styles.estado,
                { color: item.estado === 'ACTIVO' ? '#16a34a' : '#dc2626' },
              ]}
            >
              {item.estado}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay espacios cargados.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  hi: { fontSize: 20, fontWeight: '700' },
  count: { fontSize: 13, color: '#6b7280' },
  logout: { color: '#dc2626', fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  colorBar: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  estado: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});
