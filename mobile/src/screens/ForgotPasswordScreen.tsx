import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import { colors, spacing, utec, themed } from '../theme';
import { Button, Input, Text } from '../components/ui';
import { authApi } from '../lib/api';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim()) return setError('Ingresá tu email.');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el email.');
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
          Recuperar contraseña
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {ok ? (
          <View style={styles.okBox}>
            <View style={styles.okIcon}>
              <MailCheck size={28} color={utec.green} />
            </View>
            <Text weight="bold" size="lg" style={styles.center}>
              Revisá tu correo
            </Text>
            <Text size="sm" muted style={styles.center}>
              Si el email existe, te enviamos un enlace para restablecer tu contraseña.
            </Text>
            <Button title="Volver" fullWidth onPress={() => navigation.goBack()} />
          </View>
        ) : (
          <>
            <Text muted size="sm">
              Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>
            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@utec.edu.uy"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {error ? (
              <View style={styles.errorBox}>
                <Text size="sm" color={colors.destructive}>
                  {error}
                </Text>
              </View>
            ) : null}
            <Button title="Enviar enlace" fullWidth loading={loading} onPress={submit} />
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
  okIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: utec.green + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: { backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 8, padding: spacing[3] },
}));
