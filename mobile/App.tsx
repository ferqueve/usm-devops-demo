import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type Theme as NavTheme,
} from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Silenciar deprecaciones no accionables de librerías (solo dev).
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

function ThemedApp() {
  const { mode, colors } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme: NavTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.secondary,
      card: colors.background,
      text: colors.foreground,
      border: colors.border,
      primary: colors.foreground,
    },
  };
  return (
    <>
      <NavigationContainer theme={navTheme}>
        <RootNavigator key={mode} />
      </NavigationContainer>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    UTEC: require('./assets/fonts/UTEC.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
