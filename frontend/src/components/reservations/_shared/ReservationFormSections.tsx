import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeSelect } from '@/components/ui/time-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Plus, X } from 'lucide-react';
import type { User } from '@/lib/types/users';
import type {
  ItemSolicitadoForm,
  ReservaFormDataShape,
} from './reservationFormHelpers';
import { calcularCantidadReservas } from './reservationFormHelpers';

interface EspacioOption {
  id: number;
  nombre: string;
  capacidad?: number;
  estado?: string;
}

interface CarreraOption {
  id: number;
  nombre: string;
  codigo?: string;
}

interface TipoElementoOption {
  id: number;
  nombre: string;
}

// ----- Espacio Select -----
export interface EspacioSelectProps {
  value: string;
  espaciosDisponibles: EspacioOption[];
  onChange: (value: string) => void;
}

export function EspacioSelect({ value, espaciosDisponibles, onChange }: Readonly<EspacioSelectProps>) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="espacio" className="text-sm font-semibold text-gray-700 min-w-[80px]">Espacio *</Label>
      <div className="flex-1">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="espacio" className="h-10">
            <SelectValue placeholder="Seleccionar espacio" />
          </SelectTrigger>
          <SelectContent>
            {espaciosDisponibles.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No hay espacios disponibles
              </div>
            ) : (
              espaciosDisponibles.map((espacio) => (
                <SelectItem key={espacio.id} value={espacio.id.toString()}>
                  {espacio.nombre} (Cap: {espacio.capacidad})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ----- Carrera Select -----
export interface CarreraSelectProps {
  value: string;
  carreras: CarreraOption[];
  onChange: (value: string) => void;
}

export function CarreraSelect({ value, carreras, onChange }: Readonly<CarreraSelectProps>) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="carrera" className="text-sm font-semibold text-gray-700 min-w-[80px]">Carrera</Label>
      <div className="flex-1">
        <Select
          value={value || 'ninguna'}
          onValueChange={(val) => onChange(val === 'ninguna' ? '' : val)}
        >
          <SelectTrigger id="carrera" className="h-10">
            <SelectValue placeholder="Seleccionar carrera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ninguna">Ninguna</SelectItem>
            {carreras.map((carrera) => (
              <SelectItem key={carrera.id} value={carrera.id.toString()}>
                {carrera.nombre} {carrera.codigo ? `(${carrera.codigo})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ----- Analista Select -----
export interface AnalistaSelectProps {
  value: string;
  analistas: User[];
  onChange: (value: string) => void;
}

export function AnalistaSelect({ value, analistas, onChange }: Readonly<AnalistaSelectProps>) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="analista" className="text-sm font-semibold text-gray-700 min-w-[80px]">
        Analista *
      </Label>
      <div className="flex-1">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="analista" className="h-10">
            <SelectValue placeholder="Seleccionar analista" />
          </SelectTrigger>
          <SelectContent>
            {analistas.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                <p className="font-medium mb-1">No hay analistas disponibles</p>
                <p className="text-xs">Contacta al administrador para crear un analista</p>
              </div>
            ) : (
              analistas.map((analista) => (
                <SelectItem key={analista.id} value={analista.id.toString()}>
                  {analista.nombre} ({analista.email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ----- Items Solicitados Section -----
export interface ItemsSolicitadosSectionProps {
  items: ItemSolicitadoForm[];
  tiposElemento: TipoElementoOption[];
  onAgregar: () => void;
  onEliminar: (index: number) => void;
  onActualizar: (index: number, field: string, value: string | number) => void;
}

interface ItemSolicitadoCardProps {
  item: ItemSolicitadoForm;
  index: number;
  tipoNombre: string | undefined;
  tiposElemento: TipoElementoOption[];
  onActualizar: (index: number, field: string, value: string | number) => void;
  onEliminar: (index: number) => void;
}

function ItemSolicitadoCard({
  item,
  index,
  tipoNombre,
  tiposElemento,
  onActualizar,
  onEliminar,
}: Readonly<ItemSolicitadoCardProps>) {
  const observacionLimpia = item.observaciones?.trim() || '';
  const observacionResumen =
    observacionLimpia.length > 45
      ? `${observacionLimpia.slice(0, 42)}...`
      : observacionLimpia || 'Sin observaciones';

  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 flex items-center gap-3">
      <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-semibold text-gray-800">
          {tipoNombre ?? 'Tipo sin definir'}
        </span>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          x{item.cantidadSolicitada}
        </span>
        <span className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[260px]">
          Obs: {observacionResumen}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[320px] space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Tipo de elemento
              </Label>
              <Select
                value={item.tipoElementoId.toString()}
                onValueChange={(value) => onActualizar(index, 'tipoElementoId', Number.parseInt(value))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposElemento.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Cantidad
              </Label>
              <Input
                type="number"
                min="1"
                value={item.cantidadSolicitada}
                onChange={(e) =>
                  onActualizar(index, 'cantidadSolicitada', Number.parseInt(e.target.value) || 1)
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Observaciones (opcional)
              </Label>
              <Textarea
                value={item.observaciones || ''}
                onChange={(e) => onActualizar(index, 'observaciones', e.target.value)}
                placeholder="Ej: Necesito marcadores nuevos"
                className="text-sm min-h-[80px] resize-none"
              />
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEliminar(index)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ItemsSolicitadosSection({
  items,
  tiposElemento,
  onAgregar,
  onEliminar,
  onActualizar,
}: Readonly<ItemsSolicitadosSectionProps>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">Items Solicitados</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAgregar}
          disabled={tiposElemento.length === 0}
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>
      {items.length > 0 && (
        <div className="space-y-3 border border-gray-200 rounded-lg p-2 bg-gray-50">
          {items.map((item, index) => {
            const tipo = tiposElemento.find((t) => t.id === item.tipoElementoId);
            return (
              <ItemSolicitadoCard
                key={item.tipoElementoId}
                item={item}
                index={index}
                tipoNombre={tipo?.nombre}
                tiposElemento={tiposElemento}
                onActualizar={onActualizar}
                onEliminar={onEliminar}
              />
            );
          })}
        </div>
      )}
      {items.length === 0 && (
        <p className="text-xs text-gray-500 italic">No hay items solicitados. Haz clic en "Agregar" para añadir uno.</p>
      )}
    </div>
  );
}

// ----- Hora inicio/fin block -----
export interface HoraInicioFinSectionProps {
  formData: ReservaFormDataShape;
  setFormData: React.Dispatch<React.SetStateAction<ReservaFormDataShape>>;
  horasInicioDisponibles: string[];
  horasFinDisponibles: string[];
  minutosInicioDisponibles: string[];
  minutosFinDisponibles: string[];
  // Si true, agrega keys dinámicas al TimeSelect (comportamiento del FormDialog).
  useDynamicKeys?: boolean;
}

export function HoraInicioFinSection({
  formData,
  setFormData,
  horasInicioDisponibles,
  horasFinDisponibles,
  minutosInicioDisponibles,
  minutosFinDisponibles,
  useDynamicKeys,
}: Readonly<HoraInicioFinSectionProps>) {
  const inicioHoraKey = useDynamicKeys ? `hora-inicio-${formData.horaInicioHora}` : undefined;
  const inicioMinutoKey = useDynamicKeys ? `minuto-inicio-${formData.horaInicioMinuto}` : undefined;
  const finHoraKey = useDynamicKeys ? `hora-fin-${formData.horaFinHora}` : undefined;
  const finMinutoKey = useDynamicKeys ? `minuto-fin-${formData.horaFinMinuto}` : undefined;

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Hora de inicio *</Label>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <TimeSelect
              key={inicioHoraKey}
              options={horasInicioDisponibles}
              value={formData.horaInicioHora}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, horaInicioHora: value }));
                if (formData.horaFinHora && Number.parseInt(value) >= Number.parseInt(formData.horaFinHora)) {
                  setFormData(prev => ({ ...prev, horaFinHora: '' }));
                }
              }}
              placeholder="00"
            />
          </div>
          <div className="text-lg font-semibold px-1.5">:</div>
          <div className="flex-1">
            <TimeSelect
              key={inicioMinutoKey}
              options={minutosInicioDisponibles}
              value={formData.horaInicioMinuto}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, horaInicioMinuto: value }));
                if (formData.horaInicioHora && formData.horaFinHora) {
                  const horaInicioNum = Number.parseInt(formData.horaInicioHora);
                  const horaFinNum = Number.parseInt(formData.horaFinHora);
                  const minInicio = Number.parseInt(value);
                  const minFin = Number.parseInt(formData.horaFinMinuto || '0');
                  if (horaInicioNum === horaFinNum && minInicio >= minFin) {
                    setFormData(prev => ({ ...prev, horaFinHora: '', horaFinMinuto: '00' }));
                  }
                }
              }}
              placeholder="00"
            />
          </div>
        </div>
      </div>

      <div className="border-l border-dashed border-gray-300 self-stretch mx-1.5"></div>

      <div className="flex-1 space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Hora de fin *</Label>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <TimeSelect
              key={finHoraKey}
              options={horasFinDisponibles}
              value={formData.horaFinHora}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, horaFinHora: value }));
                if (formData.horaInicioHora && value === formData.horaInicioHora) {
                  const minInicio = Number.parseInt(formData.horaInicioMinuto || '0');
                  const minFin = Number.parseInt(formData.horaFinMinuto || '0');
                  if (minFin <= minInicio) {
                    const minValido = minInicio + 30;
                    if (minValido >= 60) {
                      setFormData(prev => ({ ...prev, horaFinHora: '', horaFinMinuto: '00' }));
                    } else {
                      setFormData(prev => ({ ...prev, horaFinMinuto: minValido.toString().padStart(2, '0') }));
                    }
                  }
                }
              }}
              placeholder="00"
            />
          </div>
          <div className="text-lg font-semibold px-1.5">:</div>
          <div className="flex-1">
            <TimeSelect
              key={finMinutoKey}
              options={minutosFinDisponibles}
              value={formData.horaFinMinuto}
              onChange={(value) => setFormData(prev => ({ ...prev, horaFinMinuto: value }))}
              placeholder="00"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Recurrencia Section -----
export interface RecurrenciaSectionProps {
  formData: ReservaFormDataShape;
  setFormData: React.Dispatch<React.SetStateAction<ReservaFormDataShape>>;
  fecha: Date | undefined;
}

export function RecurrenciaSection({ formData, setFormData, fecha }: Readonly<RecurrenciaSectionProps>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label className="text-sm font-semibold text-gray-700 min-w-[80px]">Recurrencia</Label>
        <div className="flex-1">
          <Select
            value={formData.tipoRecurrencia || 'ninguna'}
            onValueChange={(value) => {
              setFormData(prev => ({
                ...prev,
                tipoRecurrencia: value === 'ninguna' ? '' : value as 'DIARIA' | 'SEMANAL' | 'MENSUAL',
                fechaFinRecurrencia: value === 'ninguna' ? undefined : prev.fechaFinRecurrencia,
              }));
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Seleccionar recurrencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguna">Sin recurrencia (una sola vez)</SelectItem>
              <SelectItem value="DIARIA">Diaria (todos los días)</SelectItem>
              <SelectItem value="SEMANAL">Semanal (mismo día de la semana)</SelectItem>
              <SelectItem value="MENSUAL">Mensual (mismo día del mes)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.tipoRecurrencia && (
        <>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold text-gray-700 min-w-[80px]">
              Hasta el día
            </Label>
            <div className="flex-1">
              <DatePicker
                value={formData.fechaFinRecurrencia}
                onChange={(date) => setFormData(prev => ({ ...prev, fechaFinRecurrencia: date }))}
                placeholder="Seleccionar fecha de fin"
                minDate={fecha ? new Date(fecha.getTime() + 24 * 60 * 60 * 1000) : new Date()}
              />
            </div>
          </div>

          {formData.fechaFinRecurrencia && fecha && formData.tipoRecurrencia && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Se crearán aproximadamente{' '}
                <span className="font-bold">
                  {calcularCantidadReservas(
                    fecha,
                    formData.fechaFinRecurrencia,
                    formData.tipoRecurrencia
                  )}
                </span>{' '}
                reservas
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {formData.tipoRecurrencia === 'DIARIA' && 'Una reserva por día'}
                {formData.tipoRecurrencia === 'SEMANAL' && 'Una reserva por semana'}
                {formData.tipoRecurrencia === 'MENSUAL' && 'Una reserva por mes'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
