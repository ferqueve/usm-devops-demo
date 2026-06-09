import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, spacing, themed } from '../../theme';
import { Button, Input, SelectField, Text } from '../ui';
import { spacesApi } from '../../lib/api';
import type { Edificio, Espacio, TipoEspacio } from '../../lib/types';

export type EspacioFormModalProps = {
  visible: boolean;
  espacio?: Espacio | null;
  onClose: () => void;
  onSaved: () => void;
};

const ESTADOS = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
  { label: 'No disponible', value: 'NO_DISPONIBLE' },
];

export function EspacioFormModal({ visible, espacio, onClose, onSaved }: EspacioFormModalProps) {
  const insets = useSafeAreaInsets();
  const editing = !!espacio;
  const [tipos, setTipos] = useState<TipoEspacio[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);

  const [nombre, setNombre] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [tipoEspacioId, setTipoEspacioId] = useState<number | null>(null);
  const [edificioId, setEdificioId] = useState<number | null>(null);
  const [estado, setEstado] = useState('DISPONIBLE');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    spacesApi.listarTiposEspacio().then(setTipos).catch(() => {});
    spacesApi.listarEdificios().then(setEdificios).catch(() => {});
    setNombre(espacio?.nombre ?? '');
    setCapacidad(espacio ? String(espacio.capacidad) : '');
    setTipoEspacioId(espacio?.tipoEspacioId ?? null);
    setEdificioId(espacio?.edificioId ?? null);
    setEstado(espacio?.estado ?? 'DISPONIBLE');
    setError(null);
    setSaving(false);
  }, [visible, espacio]);

  const submit = async () => {
    setError(null);
    const cap = parseInt(capacidad, 10);
    if (!nombre.trim()) return setError('Ingresá un nombre.');
    if (!cap || cap <= 0) return setError('Ingresá una capacidad válida.');
    if (!tipoEspacioId) return setError('Elegí un tipo de espacio.');

    setSaving(true);
    const payload = {
      nombre: nombre.trim(),
      capacidad: cap,
      tipoEspacioId,
      edificioId: edificioId ?? undefined,
      estado,
    };
    try {
      if (editing && espacio) await spacesApi.actualizarEspacio(espacio.id, payload);
      else await spacesApi.crearEspacio(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el espacio.');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <Text utec size="lg" style={styles.flex}>
            {editing ? 'Editar espacio' : 'Nuevo espacio'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Input label="Nombre" placeholder="Ej. Aula teórica 5" value={nombre} onChangeText={setNombre} />
          <Input
            label="Capacidad"
            placeholder="Ej. 30"
            value={capacidad}
            onChangeText={setCapacidad}
            keyboardType="number-pad"
          />
          <SelectField
            label="Tipo de espacio"
            placeholder="Elegí un tipo"
            value={tipoEspacioId}
            onChange={setTipoEspacioId}
            options={tipos.map((t) => ({ label: t.nombre, value: t.id }))}
          />
          <SelectField
            label="Edificio (opcional)"
            placeholder="Sin edificio"
            value={edificioId}
            onChange={setEdificioId}
            options={edificios.map((e) => ({ label: e.nombre, value: e.id }))}
          />
          <SelectField label="Estado" value={estado} onChange={setEstado} options={ESTADOS} />

          {error ? (
            <View style={styles.errorBox}>
              <Text size="sm" color={colors.destructive}>
                {error}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[3] }]}>
          <Button title="Cancelar" variant="outline" style={styles.flex} onPress={onClose} />
          <Button title={editing ? 'Guardar' : 'Crear'} style={styles.flex} loading={saving} onPress={submit} />
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
  errorBox: { backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 8, padding: spacing[3] },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
