import { useTemaGraficos } from './tema';

interface Props {
  /** 0 a 100. */
  valor: number;
  etiqueta: string;
  detalle?: string;
  /** Color del arco; por defecto cambia según los umbrales. */
  color?: string;
  /** Debajo de esto el arco se pinta como alerta, entre medio como aviso. */
  umbrales?: { alerta: number; aviso: number };
  /** Si más es peor (cancelación, problemas), se invierten los umbrales. */
  masEsPeor?: boolean;
  /** Ancho máximo del arco, en px. */
  ancho?: number;
}

/**
 * Medidor de media luna para un porcentaje que tiene un "bien" y un "mal".
 * El número va escrito en el centro: el arco ayuda, no reemplaza.
 */
export function Medidor({ valor, etiqueta, detalle, color, umbrales, masEsPeor = false, ancho = 150 }: Readonly<Props>) {
  const tema = useTemaGraficos();
  const v = Math.max(0, Math.min(100, valor));

  let tinta = color ?? tema.categorias[0];
  if (!color && umbrales) {
    const malo = masEsPeor ? v >= umbrales.alerta : v <= umbrales.alerta;
    const regular = masEsPeor ? v >= umbrales.aviso : v <= umbrales.aviso;
    tinta = malo ? tema.danado : regular ? tema.mantenimiento : tema.disponible;
  }

  // Arco de 180° de radio 40, centrado en (50, 50).
  const r = 40;
  const largo = Math.PI * r;
  const recorrido = (v / 100) * largo;

  return (
    <div className="flex w-full flex-col items-center text-center">
      {/* Tamaño en línea: una regla global de index.css achica todos los svg a 14px (es para íconos). */}
      <svg viewBox="0 0 100 58" className="mx-auto block" style={{ width: '100%', maxWidth: ancho, height: 'auto' }} role="img" aria-label={`${etiqueta}: ${Math.round(v)}%`}>
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={tema.vacio} strokeWidth="9" strokeLinecap="round" />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={tinta}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${recorrido} ${largo}`}
        />
        <text x="50" y="47" textAnchor="middle" className="fill-foreground" style={{ fontSize: 17, fontWeight: 600 }}>
          {Math.round(v)}%
        </text>
      </svg>
      <div className="-mt-1 text-sm font-medium">{etiqueta}</div>
      {detalle && <div className="text-xs text-muted-foreground">{detalle}</div>}
    </div>
  );
}
