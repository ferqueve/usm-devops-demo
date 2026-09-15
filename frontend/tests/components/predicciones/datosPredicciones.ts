import type {
  CalidadModelo,
  ForecastDemanda,
  PrediccionAcademico,
  PrediccionInventario,
  TipoInventarioML,
  TiposEspacioML,
} from '@/lib/api/stats';

/** Fechas desde un día, en formato YYYY-MM-DD. */
function dias(desde: string, cuantos: number): string[] {
  return Array.from({ length: cuantos }, (_, i) => {
    const d = new Date(`${desde}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

// ---------------------------------------------------------------- Reservas

export const forecast: ForecastDemanda = {
  modeloId: 7,
  trainedAt: '2026-09-14T03:00:00Z',
  mape: 20,
  hoy: '2026-09-15',
  historico: dias('2026-07-17', 60).map((fecha, i) => ({ fecha, real: 30 + (i % 7) })),
  predicciones: dias('2026-09-15', 30).map((fecha, i) => ({ fecha, prediccion: 40 + (i % 7), bandaInferior: 30, bandaSuperior: 52 })),
  reservadas: dias('2026-09-15', 30).map((fecha, i) => ({ fecha, cantidad: Math.max(0, 25 - i) })),
};

export const calidad: CalidadModelo = {
  modeloId: 7,
  algoritmo: 'prophet',
  trainedAt: '2026-09-14T03:00:00Z',
  sampleSize: 170,
  holdoutSize: 28,
  mape: 20,
  mae: 6,
  wape: 18,
  wapeIngenuo: 25,
  estacionalidadAnual: false,
  historicoDesde: '2026-03-24',
  historicoHasta: '2026-09-14',
  validacion: dias('2026-08-18', 28).map((fecha) => ({ fecha, real: 35, prediccion: 38, ingenuo: 30 })),
};

export const tiposEspacio: TiposEspacioML = {
  tipos: [
    {
      tipoEspacioId: 1,
      nombre: 'Aula',
      espacios: 10,
      entrenado: true,
      wape: 18.2,
      wapeIngenuo: 25,
      promedioDiarioHistorico: 40.1,
      esperadoProximos7: 300.5,
      esperadoProximos30: 1200,
      cambioPct: 5.3,
      reservadasProximos7: 210,
      picoFecha: '2026-09-21',
      picoValor: 62.3,
      serie: dias('2026-09-15', 30).map((fecha) => ({ fecha, prediccion: 41.2, bandaInferior: 30.1, bandaSuperior: 52.3, reservadas: 35 })),
    },
    {
      tipoEspacioId: 2,
      nombre: 'Laboratorio',
      espacios: 1,
      entrenado: true,
      wape: 30,
      wapeIngenuo: 28,
      promedioDiarioHistorico: 3.2,
      esperadoProximos7: 21,
      esperadoProximos30: 90,
      cambioPct: -12,
      reservadasProximos7: 10,
      picoFecha: '2026-09-17',
      picoValor: 5,
      serie: dias('2026-09-15', 30).map((fecha) => ({ fecha, prediccion: 3, bandaInferior: 1, bandaSuperior: 5, reservadas: 2 })),
    },
    {
      tipoEspacioId: 4,
      nombre: 'Otro',
      espacios: 1,
      entrenado: false,
      wape: null,
      wapeIngenuo: null,
      promedioDiarioHistorico: null,
      esperadoProximos7: null,
      esperadoProximos30: null,
      cambioPct: null,
      reservadasProximos7: null,
      picoFecha: null,
      picoValor: null,
      serie: [],
    },
  ],
};

// -------------------------------------------------------------- Inventario

function tipoInventario(parcial: Partial<TipoInventarioML> & Pick<TipoInventarioML, 'tipoElementoId' | 'nombre'>): TipoInventarioML {
  return {
    status: 'ok',
    detalle: null,
    stockDisponible: 8,
    stockTotal: 11,
    mediaHistorica: 6.2,
    wape: 21,
    wapeIngenuo: 28,
    alpha: 0.35,
    tendenciaSemanalPct: 1.2,
    diaSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, i) => ({ dia, multiplicador: [1.3, 1.2, 1.1, 1, 0.9, 0.3, 0.2][i] })),
    picoEsperado: 14.2,
    fechaPico: '2026-09-22',
    probFaltanteMax: 0.81,
    diasEnRiesgo: 9,
    riesgo: 'alto',
    serie: dias('2026-09-15', 30).map((fecha, i) => ({ fecha, prediccion: 7.1, bandaInferior: 4, bandaSuperior: 11, comprometidas: i < 3 ? 5 : 0, probFaltante: i === 1 ? 0.72 : 0.12 })),
    semanas: [
      { semana: '2026-09-14', picoEsperado: 11.3, probFaltanteMax: 0.72, comprometidasMax: 5 },
      { semana: '2026-09-21', picoEsperado: 14.2, probFaltanteMax: 0.81, comprometidasMax: 0 },
    ],
    ...parcial,
  };
}

export const inventario: PrediccionInventario = {
  modelo: {
    entrenado: true,
    algoritmo: 'binomial_negativa',
    entrenadoEn: '2026-09-14T22:00:00Z',
    wape: 22.1,
    wapeIngenuo: 30.4,
    historicoDesde: '2026-03-24',
    historicoHasta: '2026-09-13',
    holdoutDias: 28,
    horizonteDias: 30,
    intervalo: 0.8,
  },
  resumen: {
    tipos: 3,
    tiposEnRiesgo: 2,
    tiposSinStock: 1,
    primerFaltante: { tipoElementoId: 5, nombre: 'Proyector', fecha: '2026-09-16', probabilidad: 0.72 },
  },
  tipos: [
    tipoInventario({ tipoElementoId: 7, nombre: 'Televisor', riesgo: 'sin_stock', stockDisponible: 0, stockTotal: 2, probFaltanteMax: 1, picoEsperado: 1.4 }),
    tipoInventario({ tipoElementoId: 5, nombre: 'Proyector' }),
    tipoInventario({ tipoElementoId: 1, nombre: 'Silla', riesgo: 'bajo', stockDisponible: 300, stockTotal: 320, probFaltanteMax: 0.01, diasEnRiesgo: 0, picoEsperado: 80 }),
    tipoInventario({
      tipoElementoId: 9,
      nombre: 'Sistema de Audio',
      status: 'omitido',
      detalle: 'Sólo 6 días con pedidos',
      stockDisponible: null,
      stockTotal: null,
      mediaHistorica: null,
      wape: null,
      wapeIngenuo: null,
      alpha: null,
      tendenciaSemanalPct: null,
      diaSemana: null,
      picoEsperado: null,
      fechaPico: null,
      probFaltanteMax: null,
      diasEnRiesgo: null,
      riesgo: null,
      serie: [],
      semanas: null,
    }),
  ],
};

// --------------------------------------------------------------- Académico

export const academico: PrediccionAcademico = {
  modelo: {
    entrenado: true,
    algoritmo: 'regresion_logistica',
    entrenadoEn: '2026-09-14T22:00:00Z',
    muestras: 580,
    tasaBase: 0.55,
    auc: 0.71,
    brier: 0.21,
    brierBase: 0.247,
    logLoss: 0.6,
    exactitud: 0.66,
    validacion: { desde: '2026-08-20', hasta: '2026-09-02', n: 145 },
    calibracion: [
      { desde: 0, hasta: 0.2, predicho: 0.12, real: 0.1, n: 20 },
      { desde: 0.2, hasta: 0.4, predicho: 0.31, real: 0.35, n: 30 },
      { desde: 0.4, hasta: 0.6, predicho: 0.5, real: 0.52, n: 40 },
    ],
    factores: [
      { clave: 'tasa_previa_estudiante', nombre: 'Asistencia previa del estudiante', oddsRatio: 1.9, efecto: 'sube' },
      { clave: 'antelacion', nombre: 'Horas de antelación', oddsRatio: 0.7, efecto: 'baja' },
      { clave: 'temario', nombre: 'Tiene temario', oddsRatio: 1.02, efecto: 'neutro' },
    ],
    historicoSemanal: [
      { semana: '2026-08-17', inscriptos: 40, asistieron: 22, esperados: 23.4 },
      { semana: '2026-08-24', inscriptos: 38, asistieron: 20, esperados: 21 },
    ],
  },
  resumen: { proximas: 3, inscriptos: 19, esperados: 5.5, tasaEsperada: 0.55, enRiesgoVacias: 1, desbordadas: 0 },
  proximas: [
    {
      tutoriaId: 1,
      materia: 'Cálculo I',
      carrera: 'Ingeniería',
      docente: 'Docente 2',
      inicio: '2026-09-16T13:00:00Z',
      modalidad: 'PRESENCIAL',
      tipo: 'GRUPAL',
      espacio: 'Aula 9',
      capacidadEspacio: 30,
      cupo: 10,
      inscriptos: 8,
      esperados: 4.6,
      bandaInferior: 3,
      bandaSuperior: 6,
      tasaEsperada: 0.575,
      riesgo: 'normal',
      inscripciones: [
        { estudiante: 'Estudiante 4', probabilidad: 0.81, asistenciasPrevias: 5, inscripcionesPrevias: 6 },
        { estudiante: 'Estudiante 9', probabilidad: 0.22, asistenciasPrevias: 0, inscripcionesPrevias: 0 },
      ],
    },
    {
      tutoriaId: 2,
      materia: 'Física II',
      carrera: 'Ingeniería',
      docente: 'Docente 3',
      inicio: '2026-09-17T21:00:00Z',
      modalidad: 'VIRTUAL',
      tipo: 'INDIVIDUAL',
      espacio: null,
      capacidadEspacio: null,
      cupo: 4,
      inscriptos: 2,
      esperados: 0.9,
      bandaInferior: 0,
      bandaSuperior: 2,
      tasaEsperada: 0.45,
      riesgo: 'vacia',
      inscripciones: [{ estudiante: 'Estudiante 12', probabilidad: 0.45, asistenciasPrevias: 1, inscripcionesPrevias: 3 }],
    },
    {
      tutoriaId: 3,
      materia: 'Programación',
      carrera: null,
      docente: null,
      inicio: '2026-09-22T12:00:00Z',
      modalidad: 'PRESENCIAL',
      tipo: 'GRUPAL',
      espacio: 'Laboratorio',
      capacidadEspacio: 20,
      cupo: 9,
      inscriptos: 9,
      esperados: null,
      bandaInferior: null,
      bandaSuperior: null,
      tasaEsperada: null,
      riesgo: 'sin_prediccion',
      inscripciones: [],
    },
  ],
};
