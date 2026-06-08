import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import EspaciosScreen from './src/screens/EspaciosScreen';
import { getToken, logout as apiLogout } from './src/api';

export default function App() {
  const [ready, setReady] = useState(false);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        // Si hay token guardado asumimos sesión válida (POC).
        // En producción: verificar con /auth/verify.
        setNombre(token ? 'Usuario' : null);
      } catch (e) {
        // Si el storage falla, arrancamos sin sesión en vez de colgar la app.
        console.warn('No se pudo leer el token guardado:', e);
        setNombre(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        {nombre ? (
          <EspaciosScreen
            nombre={nombre}
            onLogout={async () => { await apiLogout(); setNombre(null); }}
          />
        ) : (
          <LoginScreen onLoggedIn={setNombre} />
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
