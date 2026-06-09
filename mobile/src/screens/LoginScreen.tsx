import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { colors, spacing, utec, themed } from '../theme';
import { Button, Input, Text } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

type AuthNav = NativeStackNavigationProp<{
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
}>;

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const navigation = useNavigation<AuthNav>();
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo acceder con Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresá tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Al autenticar, el navegador raíz cambia a la app automáticamente.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Panel de marca con gradiente UTEC (equivalente al panel lateral del web). */}
        <LinearGradient
          colors={[utec.green, utec.yellow, utec.orange, utec.red, utec.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brand}
        >
          <Text utec size="3xl" color="#FFFFFF" style={styles.brandTitle}>
            UTEC Space Manager
          </Text>
          <Text color="rgba(255,255,255,0.9)" size="sm">
            Gestor de espacios de UTEC
          </Text>
        </LinearGradient>

        {/* Formulario */}
        <View style={styles.form}>
          <Text weight="bold" size="3xl">
            Iniciar Sesión
          </Text>
          <Text muted size="sm" style={styles.subtitle}>
            Ingresa tu email para acceder a tu cuenta
          </Text>

          <View style={styles.fields}>
            <Input
              label="Correo Electrónico"
              placeholder="usuario@utec.edu.uy"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              rightSlot={<Mail size={18} color={colors.mutedForeground} />}
            />

            <Input
              label="Contraseña"
              placeholder="Tu contraseña"
              secureTextEntry={!showPwd}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              rightSlot={
                <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={8}>
                  {showPwd ? (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </Pressable>
              }
            />

            <Pressable
              style={styles.forgot}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text size="sm" color={utec.blue} weight="medium">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text size="sm" color={colors.destructive}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            title="Iniciar Sesión"
            onPress={onSubmit}
            loading={loading}
            fullWidth
            icon={<Lock size={16} color={colors.primaryForeground} />}
          />

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text muted size="xs">
              O continúa con
            </Text>
            <View style={styles.line} />
          </View>

          <Button
            title="Continuar con Google"
            variant="outline"
            fullWidth
            loading={googleLoading}
            onPress={onGoogle}
          />

          <View style={styles.signupRow}>
            <Text muted size="sm">
              ¿No tienes una cuenta?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text size="sm" color={utec.blue} weight="medium">
                Regístrate
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  brand: {
    paddingTop: spacing[16],
    paddingBottom: spacing[12],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandTitle: { textAlign: 'center' },
  form: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    gap: spacing[2],
  },
  subtitle: { marginBottom: spacing[4] },
  fields: { gap: spacing[4] },
  forgot: { alignSelf: 'flex-end' },
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 8,
    padding: spacing[3],
    marginTop: spacing[1],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
    paddingBottom: spacing[8],
  },
}));
