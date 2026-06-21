import { useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

/**
 * Visor de imágenes 360° equirectangulares (photo-sphere-viewer / three.js).
 * Se importa de forma lazy para no cargar three.js salvo que se abra una 360.
 *
 * La creación se difiere un tick para evitar el doble-montaje de React
 * StrictMode (crear → destruir → crear), que dejaba la carga de la textura
 * colgada. Así sólo se instancia un viewer.
 */
export default function Panorama360Viewer({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let viewer: Viewer | null = null;

    const id = window.setTimeout(() => {
      if (!ref.current) return;
      viewer = new Viewer({
        container: ref.current,
        panorama: src,
        navbar: ['zoom', 'move', 'fullscreen'],
        defaultZoomLvl: 0,
        loadingTxt: 'Cargando 360°…',
        touchmoveTwoFingers: false,
      });
    }, 0);

    return () => {
      window.clearTimeout(id);
      viewer?.destroy();
    };
  }, [src]);

  return <div ref={ref} className="w-full h-full bg-black" />;
}
