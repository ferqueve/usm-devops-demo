import { CalendarDays, GraduationCap, MapPin, Monitor, UserRound, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { TutoriaProximaML } from '@/lib/api/stats';
import { Medidor } from '@/components/statistics/graficos/Medidor';
import { useTemaGraficos } from '@/components/statistics/graficos/tema';
import { Chip } from '../comunes';
import { decimal, entero, fechaHora, mayuscula, porcentaje01 } from '../formato';
import { colorProbabilidad, estiloTutoria } from './estilos';
import { BarraAsistencia } from './Proximas';

/**
 * Una tutoría abierta: el resumen de lo esperado y cada inscripto con su
 * probabilidad de ir, de la más alta a la más baja. Así se ve a quién
 * conviene recordarle.
 */
export function DetalleTutoria({ tutoria, onCerrar }: Readonly<{ tutoria: TutoriaProximaML | null; onCerrar: () => void }>) {
  const tema = useTemaGraficos();
  const t = tutoria;
  const estilo = t ? estiloTutoria(t.riesgo, tema) : null;
  const inscripciones = t ? [...t.inscripciones].sort((a, b) => (b.probabilidad ?? -1) - (a.probabilidad ?? -1)) : [];

  return (
    <Dialog open={t != null} onOpenChange={(abierta) => !abierta && onCerrar()}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="gap-0 overflow-hidden p-0 sm:max-w-3xl [&>button]:top-3.5 [&>button]:text-white [&>button]:ring-offset-utec-dark [&>button]:focus:ring-white/40"
      >
        {t && estilo && (
          <>
            <div className="flex items-center gap-2.5 bg-chrome px-5 py-3 pr-12 text-white">
              <span className="h-5 w-1 shrink-0 rounded-sm" style={{ backgroundColor: estilo.color }} aria-hidden />
              <DialogTitle className="truncate text-base font-semibold text-white">{t.materia}</DialogTitle>
              {t.carrera && <span className="hidden truncate text-sm text-white/60 sm:inline">{t.carrera}</span>}
            </div>
            <DialogDescription className="sr-only">Asistencia esperada y probabilidad de cada inscripto.</DialogDescription>

            <div className="max-h-[calc(90vh-52px)] overflow-y-auto">
              <div className="grid gap-4 border-b bg-muted/30 p-5 sm:grid-cols-[minmax(0,1fr)_200px]">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-muted-foreground" />{mayuscula(fechaHora(t.inicio))}</span>
                    {t.docente && <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-muted-foreground" />{t.docente}</span>}
                    <span className="inline-flex items-center gap-1.5">
                      {t.modalidad === 'VIRTUAL' ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                      {t.modalidad === 'VIRTUAL' ? 'Virtual' : t.espacio ?? 'Presencial'}
                      {t.capacidadEspacio != null && <span className="text-muted-foreground">({t.capacidadEspacio} lugares)</span>}
                    </span>
                    {t.tipo && <span className="inline-flex items-center gap-1.5 capitalize"><Users className="h-4 w-4 text-muted-foreground" />{t.tipo.toLowerCase()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip color={estilo.color} icono={estilo.icono}>{estilo.etiqueta}</Chip>
                  </div>
                  <div>
                    <BarraAsistencia t={t} color={estilo.color} />
                    <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs tabular-nums text-muted-foreground">
                      <span>
                        {t.esperados == null ? 'Sin predicción: la tutoría se creó después del último entrenamiento.' : (
                          <>se espera que vayan <b className="text-foreground">{decimal(t.esperados)}</b>
                            {t.bandaInferior != null && t.bandaSuperior != null && ` (entre ${entero(t.bandaInferior)} y ${entero(t.bandaSuperior)})`}</>
                        )}
                      </span>
                      <span>{entero(t.inscriptos)} inscriptos{t.cupo != null && ` · cupo ${t.cupo}`}</span>
                    </div>
                  </div>
                </div>
                <Medidor
                  valor={(t.tasaEsperada ?? 0) * 100}
                  etiqueta="Asistencia esperada"
                  detalle={t.tasaEsperada == null ? 'sin predicción' : 'de los inscriptos'}
                  color={estilo.color}
                  ancho={170}
                />
              </div>

              <div className="p-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" /> Inscriptos · probabilidad de ir
                </h3>
                {inscripciones.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay inscriptos.</p>
                ) : (
                  <ul className="space-y-2">
                    {inscripciones.map((i, n) => {
                      const color = colorProbabilidad(i.probabilidad, tema);
                      return (
                        <li key={`${i.estudiante}-${n}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_48px] items-center gap-3 text-sm">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{i.estudiante}</span>
                            <span className="block text-2xs text-muted-foreground">
                              {i.inscripcionesPrevias === 0 ? 'primera tutoría' : `fue a ${i.asistenciasPrevias} de ${i.inscripcionesPrevias} anteriores`}
                            </span>
                          </span>
                          <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <span className="block h-full rounded-full" style={{ width: `${(i.probabilidad ?? 0) * 100}%`, backgroundColor: color }} />
                          </span>
                          <span className="text-right font-semibold tabular-nums">{porcentaje01(i.probabilidad)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
