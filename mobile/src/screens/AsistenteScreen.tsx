import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Sparkles } from 'lucide-react-native';
import { colors, fonts, fontSize, radius, spacing, utec, themed } from '../theme';
import { MarkdownText, Text } from '../components/ui';
import { aiApi } from '../lib/api';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  provider?: string;
};

const SUGERENCIAS = [
  '¿Qué espacios hay disponibles mañana?',
  'Resumime las reservas pendientes',
  '¿Cuál es el aula más usada?',
];

let counter = 0;
const nextId = () => `m${counter++}`;

export default function AsistenteScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const mensaje = text.trim();
    if (!mensaje || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: mensaje }]);
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await aiApi.postChat(mensaje);
      const respuesta = res.respuesta || res.error || 'No obtuve respuesta.';
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: respuesta, provider: res.provider },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: e instanceof Error ? e.message : 'Error al contactar el asistente.',
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const empty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {empty ? (
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Sparkles size={28} color={utec.purple} />
            </View>
            <Text weight="bold" size="lg" style={styles.center}>
              Asistente IA
            </Text>
            <Text size="sm" muted style={styles.center}>
              Preguntá sobre espacios, reservas o estadísticas en lenguaje natural.
            </Text>
            <View style={styles.suggestions}>
              {SUGERENCIAS.map((s) => (
                <Pressable key={s} style={styles.suggestion} onPress={() => send(s)}>
                  <Text size="sm" color={utec.blue}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubbleRow, m.role === 'user' ? styles.right : styles.left]}
            >
              <View style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                {m.role === 'user' ? (
                  <Text size="sm" color="#FFFFFF">
                    {m.text}
                  </Text>
                ) : (
                  <MarkdownText size="sm" color={colors.foreground}>
                    {m.text}
                  </MarkdownText>
                )}
                {m.provider ? (
                  <Text size="xs" color={colors.mutedForeground} style={styles.provider}>
                    {m.provider}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
        {sending ? (
          <View style={[styles.bubbleRow, styles.left]}>
            <View style={[styles.bubble, styles.aiBubble]}>
              <ActivityIndicator size="small" color={utec.purple} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing[2] }]}>
        <TextInput
          style={styles.input}
          placeholder="Escribí tu mensaje…"
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => send(input)}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || sending}
        >
          <Send size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.secondary },
  scroll: { padding: spacing[4], gap: spacing[3], flexGrow: 1 },
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingTop: spacing[12] },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: utec.purple + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  center: { textAlign: 'center' },
  suggestions: { marginTop: spacing[4], gap: spacing[2], alignSelf: 'stretch' },
  suggestion: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing[3],
  },
  bubbleRow: { flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  userBubble: { backgroundColor: utec.blue, borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  provider: { marginTop: spacing[1], textTransform: 'capitalize' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2.5],
    paddingBottom: spacing[2.5],
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: utec.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
}));
