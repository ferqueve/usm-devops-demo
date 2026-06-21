import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, themed } from '../theme';
import { Button, Input, Text } from '../components/ui';
import { authApi } from '../lib/api';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!nombre.trim() || !apellido.trim() || !email.trim()) return setError('Completá nombre, apellido y email.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await authApi.register({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        password,
        confirmPassword: confirm,
      });
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text utec size="lg">
          Crear cuenta
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {ok ? (
          <View style={styles.okBox}>
            <Text weight="bold" size="lg" style={styles.center}>
              ¡Cuenta creada!
            </Text>
            <Text size="sm" muted style={styles.center}>
              Te enviamos un email para verificar tu cuenta. Revisá tu bandeja y luego iniciá sesión.
            </Text>
            <Button title="Volver al inicio de sesión" fullWidth onPress={() => navigation.goBack()} />
          </View>
        ) : (
          <>
            <Text muted size="sm">
              Completá tus datos para registrarte en UTEC Space Manager.
            </Text>
            <Input label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
            <Input label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Tu apellido" />
            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@utec.edu.uy"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
            />
            <Input
              label="Confirmar contraseña"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repetí la contraseña"
              secureTextEntry
            />
            {error ? (
              <View style={styles.errorBox}>
                <Text size="sm" color={colors.destructive}>
                  {error}
                </Text>
              </View>
            ) : null}
            <Button title="Crear cuenta" fullWidth loading={loading} onPress={submit} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { padding: spacing[5], gap: spacing[4] },
  center: { textAlign: 'center' },
  okBox: { gap: spacing[3], alignItems: 'center', paddingTop: spacing[12] },
  errorBox: { backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 8, padding: spacing[3] },
}));
