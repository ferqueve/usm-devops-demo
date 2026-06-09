import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, spacing, utec, themed } from '../../theme';
import { Button, DateTimeField, Input, SelectField, Text } from '../ui';
import { carrerasApi, reservationsApi, spacesApi } from '../../lib/api';
import type { Carrera, Espacio } from '../../lib/types';

export type ReservaFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function combinar(fecha: Date, hora: Date): Date {
  const d = new Date(fecha);
  d.setHours(hora.getHours(), hora.getMinutes(), 0, 0);
  return d;
}

export function ReservaFormModal({ visible, onClose, onCreated }: ReservaFormModalProps) {
  const insets = useSafeAreaInsets();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [carreraId, setCarreraId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  const [fecha, setFecha] = useState(() => new Date(Date.now() + 86400000));
  const [inicio, setInicio] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [fin, setFin] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    spacesApi.obtenerEspacios().then(setEspacios).catch(() => {});
    carrerasApi.obtenerCarreras().then(setCarreras).catch(() => {});
  }, [visible]);

  const reset = () => {
    setEspacioId(null);
    setCarreraId(null);
    setTitulo('');
    setMotivo('');
    setEsPublica(false);
    setError(null);
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError(null);
    if (!espacioId) return setError('Elegí un espacio.');
    if (!titulo.trim()) return setError('Ingresá un título.');
    const inicioFull = combinar(fecha, inicio);
    const finFull = combinar(fecha, fin);
    if (finFull <= inicioFull) return setError('La hora de fin debe ser posterior al inicio.');

    setSaving(true);
    try {
      await reservationsApi.crearReserva({
        espacioId,
        carreraId: carreraId ?? undefined,
        inicio: inicioFull.toISOString(),
        fin: finFull.toISOString(),
        titulo: titulo.trim(),
        motivoSolicitud: motivo.trim() || undefined,
        esPublica,
      });
      onCreated();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la reserva.');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <Text utec size="lg" style={styles.flex}>
            Nueva reserva
          </Text>
          <Pressable onPress={close} hitSlop={8}>
            <X size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <SelectField
            label="Espacio"
            placeholder="Elegí un espacio"
            value={espacioId}
            onChange={setEspacioId}
            options={espacios.map((e) => ({
              label: e.nombre,
              value: e.id,
              sublabel: `${e.tipoEspacioNombre ?? ''} · cap. ${e.capacidad}`,
            }))}
          />

          <DateTimeField label="Fecha" value={fecha} mode="date" minimumDate={new Date()} onChange={setFecha} />

          <View style={styles.row}>
            <DateTimeField label="Inicio" value={inicio} mode="time" onChange={setInicio} />
            <DateTimeField label="Fin" value={fin} mode="time" onChange={setFin} />
          </View>

          <Input label="Título" placeholder="Ej. Clase de Algoritmos" value={titulo} onChangeText={setTitulo} />

          <SelectField
            label="Carrera (opcional)"
            placeholder="Sin carrera"
            value={carreraId}
            onChange={setCarreraId}
            options={carreras.map((c) => ({ label: c.nombre, value: c.id }))}
          />

          <Input
            label="Motivo (opcional)"
            placeholder="Detalle de la solicitud"
            value={motivo}
            onChangeText={setMotivo}
            multiline
          />

          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text weight="medium" size="sm">
                Reserva pública
              </Text>
              <Text size="xs" muted>
                Visible en el calendario para todos
              </Text>
            </View>
            <Switch
              value={esPublica}
              onValueChange={setEsPublica}
              trackColor={{ true: utec.green, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text size="sm" color={colors.destructive}>
                {error}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[3] }]}>
          <Button title="Cancelar" variant="outline" style={styles.flex} onPress={close} />
          <Button title="Crear reserva" style={styles.flex} loading={saving} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed((colors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { padding: spacing[4], gap: spacing[4] },
  row: { flexDirection: 'row', gap: spacing[3] },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 8,
    padding: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
