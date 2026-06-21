import { Suspense, lazy, useEffect, useState } from 'react';
import { Rotate3d, X } from 'lucide-react';

const Panorama360Viewer = lazy(() => import('./Panorama360Viewer'));

/**
 * Imagen del espacio. Muestra siempre la foto normal y, si la imagen es
 * equirectangular (relación ~2:1, típica de las 360°), agrega un botón "360°"
 * que abre un visor panorámico interactivo en un overlay a pantalla completa.
 *
 * Se usa un overlay propio (no Radix Dialog) porque el FocusScope del Dialog
 * monta un MutationObserver que choca con el visor 360 (que reescribe el DOM).
 */
export function SpaceImage({ src, alt }: { src: string; alt: string }) {
  const [is360, setIs360] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIs360(false);
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setIs360(ratio >= 1.9 && ratio <= 2.2);
    };
    img.src = src;
  }, [src]);

  // Escape para cerrar + bloqueo de scroll del body mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative">
      <img src={src} alt={alt} className="w-full aspect-video object-cover" />

      {is360 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/80 hover:scale-105"
          title="Ver en 360°"
        >
          <Rotate3d className="h-4 w-4" />
          360°
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" role="dialog" aria-modal="true">
          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Rotate3d className="h-4 w-4 text-utec-cyan" />
              Vista 360° · {alt}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Suspense
              fallback={
                <div className="grid h-full place-items-center text-sm text-white/70">
                  Cargando 360°…
                </div>
              }
            >
              <Panorama360Viewer src={src} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
