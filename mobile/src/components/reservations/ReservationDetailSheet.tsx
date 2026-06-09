import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  CalendarDays,
  Check,
  Clock,
  GraduationCap,
  Package,
  User,
  X,
} from 'lucide-react-native';
import { colors, radius, spacing, utec, themed } from '../../theme';
import { Badge, Button, StatusBadge, Text } from '../ui';
import { Input } from '../ui/Input';
import { reservationsApi } from '../../lib/api';
import { formatDuracion, formatFechaLarga, formatHora } from '../../lib/format';
import type { Reserva } from '../../lib/types';

export type ReservationDetailSheetProps = {
  reserva: Reserva | null;
  visible: boolean;
  canManage?: boolean;
  onClose: () => void;
  onChanged: () => void;
};

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldBody}>
        <Text size="xs" muted>
          {label}
        </Text>
        <Text size="sm" weight="medium">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ReservationDetailSheet({
  reserva,
  visible,
  canManage,
  onClose,
  onChanged,
}: ReservationDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRejecting(false);
    setReason('');
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  if (!reserva) return null;

  const aprobar = async () => {
    setBusy(true);
    setError(null);
    try {
      await reservationsApi.aprobarReserva(reserva.id);
      onChanged();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aprobar.');
      setBusy(false);
    }
  };

  const rechazar = async () => {
    if (!reason.trim()) {
      setError('Indicá un motivo de rechazo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reservationsApi.rechazarReserva(reserva.id, reason.trim());
      onChanged();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rechazar.');
      setBusy(false);
    }
  };

  const showActions = canManage && reserva.estado === 'PENDIENTE';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text weight="bold" size="lg" style={styles.headerTitle} numberOfLines={2}>
              {reserva.titulo}
            </Text>
            <Pressable onPress={close} hitSlop={8}>
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.badges}>
            <StatusBadge status={reserva.estado} />
            {reserva.esPublica ? <Badge label="Pública" variant="secondary" /> : null}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Field
              icon={<Building2 size={16} color={utec.blue} />}
              label="Espacio"
              value={`${reserva.espacioNombre}${reserva.capacidadEspacio ? ` · cap. ${reserva.capacidadEspacio}` : ''}`}
            />
            <Field
              icon={<CalendarDays size={16} color={utec.blue} />}
              label="Fecha"
              value={formatFechaLarga(reserva.inicio)}
            />
            <Field
              icon={<Clock size={16} color={utec.blue} />}
              label="Horario"
              value={`${formatHora(reserva.inicio)} – ${formatHora(reserva.fin)} (${formatDuracion(reserva.inicio, reserva.fin)})`}
            />
            <Field
              icon={<User size={16} color={utec.blue} />}
              label="Solicitante"
              value={`${reserva.usuarioNombre}\n${reserva.usuarioEmail}`}
            />
            {reserva.carreraNombre ? (
              <Field
                icon={<GraduationCap size={16} color={utec.blue} />}
                label="Carrera"
                value={reserva.carreraNombre}
              />
            ) : null}
            {reserva.motivoSolicitud ? (
              <Field
                icon={<Package size={16} color={utec.blue} />}
                label="Motivo"
                value={reserva.motivoSolicitud}
              />
            ) : null}

            {reserva.itemsSolicitados && reserva.itemsSolicitados.length > 0 ? (
              <View style={styles.items}>
                <Text size="xs" muted style={styles.itemsTitle}>
                  Inventario solicitado
                </Text>
                {reserva.itemsSolicitados.map((it) => (
                  <View key={it.id} style={styles.itemRow}>
                    <Text size="sm">
                      {it.cantidadSolicitada}× {it.tipoElementoNombre}
                    </Text>
                    <StatusBadge status={it.estado} />
                  </View>
                ))}
              </View>
            ) : null}

            {reserva.mensajeAnalista ? (
              <View style={styles.note}>
                <Text size="xs" muted>
                  Mensaje del analista
                </Text>
                <Text size="sm">{reserva.mensajeAnalista}</Text>
              </View>
            ) : null}
          </ScrollView>

          {error ? (
            <Text size="sm" color={colors.destructive} style={styles.error}>
              {error}
            </Text>
          ) : null}

          {showActions ? (
            rejecting ? (
              <View style={styles.actionsCol}>
                <Input
                  placeholder="Motivo del rechazo…"
                  value={reason}
                  onChangeText={setReason}
                  autoFocus
                />
                <View style={styles.actionsRow}>
                  <Button
                    title="Volver"
                    variant="outline"
                    style={styles.flex}
                    onPress={() => {
                      setRejecting(false);
                      setError(null);
                    }}
                  />
                  <Button
                    title="Confirmar rechazo"
                    variant="destructive"
                    style={styles.flex}
                    loading={busy}
                    onPress={rechazar}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <Button
                  title="Rechazar"
                  variant="outline"
                  style={styles.flex}
                  icon={<X size={16} color={colors.destructive} />}
                  onPress={() => setRejecting(true)}
                />
                <Button
                  title="Aprobar"
                  style={[styles.flex, { backgroundColor: utec.green }]}
                  loading={busy}
                  icon={<Check size={16} color="#FFFFFF" />}
                  onPress={aprobar}
                />
              </View>
            )
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = themed((colors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTouch: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing[3],
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  headerTitle: { flex: 1 },
  badges: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  body: { marginTop: spacing[3] },
  bodyContent: { gap: spacing[3], paddingBottom: spacing[2] },
  field: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: { flex: 1, gap: 1 },
  items: { gap: spacing[2], marginTop: spacing[1] },
  itemsTitle: { marginBottom: spacing[1] },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  note: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing[3],
    gap: 2,
  },
  error: { marginTop: spacing[2] },
  actionsCol: { gap: spacing[3], marginTop: spacing[3] },
  actionsRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[3] },
  flex: { flex: 1 },
}));
