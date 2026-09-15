import type { Explicacion } from './PanelEstadistica';

/**
 * Qué muestra cada estadística, cómo se calcula y cómo leerla. Vive aparte
 * para que el texto se revise en un solo lugar y coincida con lo que hace el
 * código: si cambia un cálculo, cambia acá.
 */
export const EXPLICACIONES = {
  // ---------------------------------------------------------------- Reservas
  evolucion: {
    que: 'Cuántas reservas se pidieron en cada día, semana o mes del período, y en qué estado quedaron.',
    como: 'Cuenta las reservas por la fecha en que empiezan, en la hora de Montevideo. Hasta 45 días agrupa por día, hasta 200 por semana (de lunes a domingo) y más allá por mes.',
    lectura: 'La altura es el total. El verde son las aprobadas, el ámbar las que siguen pendientes y el rojo las canceladas. Una barra alta con mucho ámbar es demanda que nadie resolvió.',
    ojo: 'La primera y la última barra suelen quedar cortadas por el período (una semana o un mes a medias). Se ven más claras para que no parezcan una caída.',
    fuente: 'vivo',
  },
  terminaron: {
    que: 'Cómo terminaron las reservas del período, separando las pendientes que todavía se pueden resolver de las que vencieron sin respuesta.',
    como: 'Una pendiente "vencida" es la que sigue pendiente y cuya fecha de inicio ya pasó. "Se aprueban" divide las aprobadas por las resueltas (aprobadas + canceladas). "Sin respuesta" divide las vencidas por todas las pendientes.',
    lectura: 'Los medidores cambian de color con umbrales: aprobar menos del 60% de lo resuelto o dejar vencer más del 30% de lo pendiente se marca en rojo.',
    ojo: 'Una reserva vencida no se canceló: nadie la respondió. Es un indicador del trabajo de aprobación, no de la demanda.',
    fuente: 'vivo',
  },
  calendario: {
    que: 'Las reservas aprobadas de cada día del período, en forma de calendario.',
    como: 'Cada cuadrado es un día; el color va del más claro (menos reservas) al más oscuro (el día con más reservas del período).',
    lectura: 'Sirve para encontrar lo que un promedio esconde: feriados y recesos (columnas claras), semanas de exámenes o eventos (manchas oscuras) y el patrón de lunes a viernes.',
    fuente: 'vivo',
  },
  semana: {
    que: 'Cuánto pesa cada día de la semana en el total de reservas aprobadas del período.',
    como: 'Suma las reservas aprobadas por día de la semana (según la hora de inicio en Montevideo) y dibuja cada día como un eje del radar.',
    lectura: 'Un campus de clases dibuja una forma cargada de lunes a viernes y aplastada en el fin de semana. Si un día sobresale, ahí conviene reforzar la atención o liberar espacios.',
    fuente: 'vivo',
  },
  diaHora: {
    que: 'A qué día de la semana y a qué hora empiezan las reservas aprobadas.',
    como: 'Cuenta las reservas aprobadas del período agrupadas por día de la semana y hora de inicio, en la hora de Montevideo. La última columna es el total del día.',
    lectura: 'Las celdas oscuras son los horarios pico: ahí es más difícil conseguir espacio. Las claras son horarios con margen para mover actividades.',
    fuente: 'vivo',
  },
  ocupacion: {
    que: 'Cuánto se usa cada espacio: el tamaño del rectángulo son las horas reservadas y el color qué parte de su horario disponible estuvo ocupada.',
    como: 'Ocupación = horas de reservas aprobadas ÷ (14 h por día × días del período transcurridos hasta hoy inclusive). Se toma un horario de 8 a 22 h. Respeta los filtros elegidos.',
    lectura: 'Un rectángulo grande y claro se usa mucho en total pero tiene margen; uno chico y oscuro está cerca del tope. La escala va del menos al más ocupado del período. Clic en un espacio para filtrar toda la vista por él.',
    ojo: 'Las 14 h diarias incluyen fines de semana, así que un 35% puede ser mucho para un aula que sólo se usa en semana. Hoy cuenta entero aunque el día no haya terminado.',
    fuente: 'vivo',
  },
  edificio: {
    que: 'Cómo se reparten las reservas aprobadas entre edificios.',
    como: 'Suma las reservas aprobadas del período según el edificio del espacio reservado, hasta hoy. Más de cinco edificios se agrupan en "Otros".',
    lectura: 'Clic en un edificio para filtrar toda la vista por él.',
    fuente: 'vivo',
  },
  menosUsados: {
    que: 'Los cinco espacios con menor ocupación del período.',
    como: 'Ordena todos los espacios activos por ocupación de menor a mayor. "Sin uso" es un espacio sin ninguna reserva aprobada.',
    lectura: 'Son candidatos a absorber demanda de los espacios saturados, o a revisar si se justifican. Clic en uno para filtrar por él.',
    fuente: 'vivo',
  },
  burbujas: {
    que: 'Cada carrera según cuánto reserva y cuánto cancela, para detectar las que cancelan mucho con mucho volumen.',
    como: 'Horizontal: reservas resueltas (aprobadas + canceladas). Vertical: tasa de cancelación = canceladas ÷ resueltas. Tamaño: canceladas con menos de 24 h de aviso. La línea punteada es el promedio de todas las carreras.',
    lectura: 'Arriba a la derecha está lo más preocupante: mucho volumen y mucha cancelación. Por encima de la línea roja (15%) la burbuja se pinta de rojo. Clic en una burbuja para filtrar por esa carrera.',
    ojo: 'Las reservas sin carrera asociada no aparecen acá; se informan aparte al pie de la tabla por carrera.',
    fuente: 'vivo',
  },
  rol: {
    que: 'Quién pide las reservas del período, según su rol en el sistema, y qué parte de sus pedidos se aprueba.',
    como: 'Agrupa todas las reservas que empiezan en el período por el rol de quien las pidió. El porcentaje de aprobación es aprobadas ÷ pedidas.',
    lectura: 'Clic en un rol para filtrar toda la vista por él.',
    fuente: 'vivo',
  },
  carrera: {
    que: 'Las reservas por carrera: aprobadas, canceladas, canceladas con poco aviso y tasa de cancelación.',
    como: 'Tasa = canceladas ÷ (aprobadas + canceladas), sobre las reservas del período hasta hoy. "Tarde" son las canceladas con menos de 24 h entre la última modificación y el inicio. Las reservas sin carrera van en una nota al pie.',
    lectura: 'Se marcan en rojo las que cancelan más del 15%. Clic en una carrera para filtrar por ella.',
    fuente: 'vivo',
  },
  quienes: {
    que: 'Las diez personas que más reservas pidieron en el período.',
    como: 'Cuenta todas las reservas pedidas (en cualquier estado) por usuario, con cuántas se aprobaron y cuántas se cancelaron.',
    ojo: 'Cuenta a quien pidió la reserva en el sistema, que no siempre es quien usa el espacio.',
    fuente: 'vivo',
  },

  // ------------------------------------------------------------- Aprobación
  respuesta: {
    que: 'Cuánto se tarda en responder una reserva: desde que se pide hasta que se aprueba o se cancela.',
    como: 'Toma las reservas del período ya resueltas que tienen registrada la fecha de respuesta. La mediana es el tiempo que deja la mitad de las respuestas por debajo; "9 de cada 10" es el percentil 90. El medidor es la parte respondida en menos de 24 h.',
    lectura: 'Verde hasta un día, ámbar hasta tres, rojo más. El p90 muestra la cola: una mediana buena con un p90 de una semana quiere decir que algunas quedan olvidadas.',
    ojo: 'Las reservas que se crean ya aprobadas (por un admin o analista) no cuentan: nadie tuvo que responderlas. Las resueltas antes de que existiera el registro de fecha de respuesta tampoco.',
    fuente: 'vivo',
  },
  histogramaRespuesta: {
    que: 'Cómo se reparten los tiempos de respuesta en tramos, de menos de una hora a más de tres días.',
    como: 'Cuenta las respuestas del período (sin las creadas ya aprobadas) según las horas entre el pedido y la aprobación o cancelación.',
    lectura: 'Lo ideal es una montaña cargada a la izquierda. Una columna alta a la derecha es trabajo acumulado.',
    fuente: 'vivo',
  },
  analistas: {
    que: 'La carga de cada analista y cómo la está resolviendo.',
    como: 'Agrupa las reservas del período por analista asignado. La barra es el total asignado (relativo al que más tiene), partida en aprobadas, canceladas y pendientes. "Vencidas" son pendientes cuya fecha ya pasó. La mediana es su tiempo de respuesta.',
    lectura: 'Una barra larga con mucho ámbar y vencidas en rojo es alguien sobrecargado o una bandeja olvidada.',
    ojo: 'Las reservas sin analista asignado no aparecen. La mediana excluye las creadas ya aprobadas.',
    fuente: 'vivo',
  },
  antelacion: {
    que: 'Si pedir con más o menos tiempo cambia cómo termina una reserva.',
    como: 'Agrupa las reservas del período por los días entre el pedido y el inicio (en hora de Montevideo), y reparte cada grupo en aprobadas, canceladas y pendientes. Cada barra suma 100%; a la derecha, cuántas hay en el tramo.',
    lectura: 'Si las del mismo día se cancelan mucho más, conviene pedir antelación mínima; si las de más de un mes quedan pendientes, se olvidan.',
    fuente: 'vivo',
  },
  pendientesAntiguedad: {
    que: 'Hace cuánto esperan respuesta las reservas pendientes del período.',
    como: 'Toma las reservas pendientes que empiezan en el período y las agrupa por las horas desde que se pidieron hasta ahora. En rojo, las que ya tendrían que haber empezado.',
    lectura: 'Todo lo que pasa de tres días sin respuesta es para mirar hoy.',
    fuente: 'vivo',
  },

  // ------------------------------------------------------------- Espacios
  saturacion: {
    que: 'Qué tan lleno está cada tipo de espacio a cada hora de un día de semana.',
    como: 'Para cada tipo y hora de 8 a 21, en los días de lunes a viernes del período: espacios del tipo con una reserva aprobada en esa hora ÷ espacios del tipo, promediado entre los días. El punto rojo marca las horas en que algún día no quedó ningún espacio de ese tipo libre.',
    lectura: 'Una columna oscura con puntos rojos es un horario donde conseguir un laboratorio (o el tipo que sea) es imposible: ahí hace falta mover actividades o sumar espacios.',
    ojo: 'Un tipo con un solo espacio se "llena" con cualquier reserva: mirá la cantidad de espacios debajo del nombre.',
    fuente: 'vivo',
  },
  capacidadOcupacion: {
    que: 'Cada espacio según cuántas personas entran y cuánto se reserva.',
    como: 'Horizontal: la capacidad cargada. Vertical: ocupación = horas reservadas ÷ (14 h × días transcurridos). Tamaño: cantidad de reservas. La línea punteada es la ocupación promedio.',
    lectura: 'Arriba a la izquierda, espacios chicos muy pedidos (candidatos a ampliar o duplicar). Abajo a la derecha, espacios grandes que casi no se usan. Clic en una burbuja para filtrar por ese espacio.',
    ojo: 'Los espacios sin capacidad cargada no aparecen.',
    fuente: 'vivo',
  },
  usoCapacidad: {
    que: 'Tutorías y eventos del período comparados con la capacidad del espacio donde se hicieron.',
    como: 'La barra son los inscriptos (tutorías: reservas de la tutoría; eventos: inscripciones) sobre la escala del espacio; la marca azul es el cupo ofrecido y la oscura la capacidad cuando se la supera. Primero los que exceden la capacidad; después los de menor uso.',
    lectura: 'En rojo lo que no entra en el espacio; en ámbar lo que usa menos de un cuarto: se podría hacer en un espacio más chico y liberar el grande.',
    fuente: 'vivo',
  },

  // ------------------------------------------------------------- Demanda (inventario)
  embudoEquipos: {
    que: 'Qué pasa con los equipos que se piden junto con las reservas del período: cuántos se resuelven, se aprueban y se entregan.',
    como: 'Cuenta las solicitudes de equipos de las reservas que empiezan en el período elegido arriba, con los filtros de edificio, espacio y tipo. Resueltas = aprobadas + entregadas + rechazadas; aprobadas incluye las ya entregadas. La dona reparte los estados actuales.',
    lectura: 'Una caída grande entre "pedidas" y "resueltas" son pedidos que nadie mira.',
    ojo: 'A diferencia del estado actual, la demanda sí cambia con el período: con otro rango de fechas se cuentan otras reservas.',
    fuente: 'vivo',
  },
  pedidoVsDisponible: {
    que: 'Si alcanza lo que hay de cada tipo de equipo para lo que se pide.',
    como: 'Para cada tipo, la barra de color es el máximo de unidades pedidas para un mismo día dentro del período; la gris, las unidades disponibles hoy (con los filtros aplicados). Las dos barras usan la misma escala. El chip dice si alcanza, si algún día faltó, cuántas veces se pasó o si ese tipo no está en el inventario.',
    lectura: 'Primero aparece lo que no alcanza. "37× lo que hay" quiere decir que el día más pedido se necesitaron 37 veces las unidades disponibles.',
    ojo: 'Compara pedidos del período contra el inventario de hoy: si se compraron o rompieron equipos en el medio, el cruce es aproximado.',
    fuente: 'vivo',
  },
  espaciosProblemas: {
    que: 'Espacios que tienen equipos en mantenimiento o dañados hoy y que igual se siguen reservando.',
    como: 'Lista los espacios con al menos un item activo en mantenimiento o dañado (hoy), con cuántas reservas aprobadas tienen en el período.',
    lectura: 'Arriba, los que más gente afectan. "Ver estado" filtra el estado actual por ese espacio y lleva hasta ahí.',
    fuente: 'vivo',
  },

  // ------------------------------------------------------------- Académico
  tutorias: {
    que: 'Cuánto se usan las tutorías del período: qué parte del cupo se llena y cuántos de los inscriptos van.',
    como: 'Cupo ocupado = inscripciones ÷ cupo total ofrecido. Asistencia = inscripciones marcadas como "asistió" ÷ inscripciones de tutorías que ya pasaron. La calificación es el promedio de las opiniones dejadas.',
    lectura: 'Mucho cupo ocupado con poca asistencia es gente que se anota y no va: conviene recordatorios o lista de espera.',
    ojo: 'El filtro de carrera se toma por la carrera de la materia; los de edificio, espacio y tipo, por el espacio de la tutoría (las virtuales no tienen espacio).',
    fuente: 'vivo',
  },
  modalidad: {
    que: 'Cómo se dan las tutorías del período: presenciales o virtuales, grupales o individuales.',
    como: 'Cada cuadrado es el 1% de las tutorías del período. La barra de abajo reparte grupales e individuales.',
    fuente: 'vivo',
  },
  semanasTutorias: {
    que: 'Semana a semana, cuántos lugares de tutoría se agendaron y cuántos se usaron.',
    como: 'Agrupa las tutorías por la semana (de lunes a domingo) en que empiezan: agendadas son las inscripciones, asistieron las marcadas como presentes. Aparecen todas las semanas del período, también las que no tuvieron.',
    lectura: 'La distancia entre las dos áreas es la inasistencia. Las semanas recientes pueden no tener la asistencia cargada todavía.',
    fuente: 'vivo',
  },
  materias: {
    que: 'Las materias con más tutorías agendadas y cuánto se aprovechan.',
    como: 'Top 15 por inscripciones. Cada fila une asistieron (verde) con agendadas (azul): el tramo entre ambos es la inasistencia. Al lado, la calificación promedio.',
    fuente: 'vivo',
  },
  eventosResumen: {
    que: 'Cuántos eventos hubo en el período, qué parte del cupo ofrecido se llenó y cómo los calificaron.',
    como: 'Ocupación = inscripciones ÷ cupo total de los eventos del período. La calificación es el promedio de las opiniones dejadas.',
    fuente: 'vivo',
  },
  eventosTramos: {
    que: 'Cuántos eventos se llenaron y cuántos quedaron con lugares vacíos.',
    como: 'Agrupa los eventos del período por inscriptos ÷ cupo. "Llenos" son los que llegaron o pasaron el cupo.',
    lectura: 'Muchos eventos por debajo del 25% indican cupos sobredimensionados o poca difusión.',
    fuente: 'vivo',
  },
  eventosTipo: {
    que: 'Qué tipo de eventos se hicieron en el período (charlas, cursos, talleres…).',
    como: 'Cuenta los eventos del período por tipo. Al lado, la ocupación del cupo de cada tipo.',
    fuente: 'vivo',
  },
  eventos: {
    que: 'Los eventos del período con qué parte de su cupo se llenó y cómo los calificaron.',
    como: 'La barra son las inscripciones ÷ cupo. Verde desde el 70%, ámbar desde el 35%, gris por debajo y rojo si se llenó o pasó.',
    fuente: 'vivo',
  },
  externosResumen: {
    que: 'Cuánto piden espacios las organizaciones de afuera en el período y qué parte se les aprueba.',
    como: 'Suma los eventos externos cuyas reservas empiezan en el período, con los filtros aplicados. El medidor es aprobadas ÷ pedidos; las horas son las de reservas aprobadas.',
    lectura: 'Por debajo del 50% aprobado se marca en rojo: conviene revisar si los pedidos llegan incompletos o sin antelación.',
    fuente: 'vivo',
  },
  externos: {
    que: 'Las organizaciones de afuera que más espacios piden, cuánto se les aprueba y cuánto usan.',
    como: 'Agrupa los eventos externos del período por organizador. La barra, a escala del que más pide, reparte aprobados, cancelados y pendientes; "Horas" son las de reservas aprobadas y "Espacios" los distintos que usó.',
    lectura: 'Un organizador con muchas horas en pocos espacios es un uso recurrente: puede valer un convenio o un espacio fijo.',
    fuente: 'vivo',
  },

  // -------------------------------------------------------------- Inventario
  estadoParque: {
    que: 'Qué parte del inventario está disponible, en mantenimiento o dañada.',
    como: 'Cuenta los items activos según su estado, con los filtros aplicados. Un item es un registro del inventario y puede agrupar varias unidades.',
    fuente: 'modelo',
  },
  cobertura: {
    que: 'Qué tan distribuido está el inventario: cuántos espacios tienen algo asignado y cuántos items tienen un espacio.',
    como: '"Espacios equipados" = espacios activos con al menos un item ÷ espacios activos. "Con espacio asignado" = items con espacio ÷ items. Filtrando por un espacio, el primero pasa a ser tipos presentes ÷ tipos existentes.',
    lectura: 'En verde por encima del 80% (espacios) o del 90% (asignación); en rojo por debajo del 50% y del 70%.',
    fuente: 'modelo',
  },
  antiguedad: {
    que: 'Hace cuánto se dio de alta cada item y cuántos no se revisan hace más de seis meses.',
    como: 'Cada cuadrado es el 1% del parque, repartido por fecha de alta. "Sin revisar" cuenta los items cuya última modificación tiene más de 180 días.',
    ojo: 'Que un item no se modifique no quiere decir que esté mal: puede estar perfecto. Es una alerta para revisarlo.',
    fuente: 'modelo',
  },
  atencion: {
    que: 'Los items en mantenimiento o dañados, empezando por los que llevan más tiempo sin novedades.',
    como: 'Lista los items activos que no están disponibles, ordenados por los días desde su última modificación (hasta 50).',
    lectura: 'Un item dañado hace semanas es el primero a resolver o dar de baja.',
    fuente: 'modelo',
  },
  mapaTipos: {
    que: 'Cuánto hay de cada tipo de elemento y qué tipos concentran los problemas.',
    como: 'El tamaño es la cantidad de items del tipo. El color: verde sin problemas, ámbar si menos del 30% está en mantenimiento o dañado, rojo si el 30% o más.',
    lectura: 'Un rectángulo grande y rojo es un problema grande. Pasá el mouse para ver el detalle de los tipos chicos.',
    fuente: 'modelo',
  },
  tablaTipos: {
    que: 'Todos los tipos de elemento con items, unidades, reparto de estados y problemas.',
    como: 'Incluye los tipos sin ningún item (marcados como vacíos). "Problemas" = en mantenimiento + dañados.',
    fuente: 'modelo',
  },
  tablaEspacios: {
    que: 'Todos los espacios con su inventario, reparto de estados y problemas.',
    como: 'Incluye los espacios sin inventario (marcados como vacíos). Un item asignado a un espacio dado de baja cuenta como sin espacio.',
    fuente: 'modelo',
  },
  matriz: {
    que: 'Qué tipos de elemento hay en cada espacio.',
    como: 'Cada celda es la cantidad de items de ese tipo en ese espacio; más oscuro, más items. Sólo muestra espacios y tipos con algo asignado.',
    lectura: 'Sirve para ver de un golpe qué aulas no tienen proyector o dónde se concentran las sillas.',
    fuente: 'modelo',
  },
  evolucionEstado: {
    que: 'Cómo cambió el estado del parque día a día dentro del período.',
    como: 'Cada madrugada se registra una foto del inventario. El gráfico apila, para cada día, los items disponibles, en mantenimiento y dañados.',
    lectura: 'La altura total es el tamaño del parque; el grosor de cada franja, cuánto pesa cada estado.',
    ojo: 'No usa los filtros del estado actual y sólo muestra los días en que hubo foto.',
    fuente: 'foto',
  },
  tamanoParque: {
    que: 'Cuántos items tuvo el inventario cada día del período.',
    como: 'Toma la cantidad de items activos de cada foto diaria.',
    fuente: 'foto',
  },
  cambios: {
    que: 'Qué espacios ganaron o perdieron items entre la primera y la última foto del período.',
    como: 'Compara la cantidad de items de cada espacio en ambas fotos. A la derecha lo que creció, a la izquierda lo que se redujo.',
    ojo: 'Se compara contra la última foto que existe, no contra hoy: la de hoy se toma de madrugada.',
    fuente: 'foto',
  },
} satisfies Record<string, Explicacion>;
