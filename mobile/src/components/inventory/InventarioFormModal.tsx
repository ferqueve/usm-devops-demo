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
import { inventoryApi, spacesApi } from '../../lib/api';
import type { Espacio, InventarioItem, TipoElemento } from '../../lib/types';

export type InventarioFormModalProps = {
  visible: boolean;
  item?: InventarioItem | null;
  onClose: () => void;
  onSaved: () => void;
};

const ESTADOS = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
  { label: 'Dañado', value: 'DANADO' },
];

export function InventarioFormModal({ visible, item, onClose, onSaved }: InventarioFormModalProps) {
  const insets = useSafeAreaInsets();
  const editing = !!item;
  const [tipos, setTipos] = useState<TipoElemento[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);

  const [tipoElementoId, setTipoElementoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [estado, setEstado] = useState('DISPONIBLE');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    inventoryApi.listarTiposElemento().then(setTipos).catch(() => {});
    spacesApi.obtenerEspacios().then(setEspacios).catch(() => {});
    setTipoElementoId(item?.tipoElementoId ?? null);
    setCantidad(item ? String(item.cantidad) : '1');
    setEspacioId(item?.espacioId ?? null);
    setEstado(item?.estado ?? 'DISPONIBLE');
    setObservaciones(item?.observaciones ?? '');
    setError(null);
    setSaving(false);
  }, [visible, item]);

  const submit = async () => {
    setError(null);
    const cant = parseInt(cantidad, 10);
    if (!tipoElementoId) return setError('Elegí un tipo de elemento.');
    if (!cant || cant <= 0) return setError('Ingresá una cantidad válida.');

    setSaving(true);
    const payload = {
      tipoElementoId,
      cantidad: cant,
      espacioId: espacioId ?? null,
      estado,
      observaciones: observaciones.trim() || undefined,
    };
    try {
      if (editing && item) await inventoryApi.actualizarInventarioItem(item.id, payload);
      else await inventoryApi.crearInventarioItem(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el item.');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <Text utec size="lg" style={styles.flex}>
            {editing ? 'Editar item' : 'Nuevo item'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <SelectField
            label="Tipo de elemento"
            placeholder="Elegí un tipo"
            value={tipoElementoId}
            onChange={setTipoElementoId}
            options={tipos.map((t) => ({ label: t.nombre, value: t.id }))}
          />
          <Input
            label="Cantidad"
            placeholder="1"
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="number-pad"
          />
          <SelectField
            label="Espacio (opcional)"
            placeholder="Sin asignar"
            value={espacioId}
            onChange={setEspacioId}
            options={espacios.map((e) => ({ label: e.nombre, value: e.id }))}
          />
          <SelectField label="Estado" value={estado} onChange={setEstado} options={ESTADOS} />
          <Input
            label="Observaciones (opcional)"
            placeholder="Notas"
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
          />

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
