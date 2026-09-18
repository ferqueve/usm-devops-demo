import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CalendarClock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Evento } from '@/lib/types/eventos';

interface CarteleraKioskoProps {
  eventos: Evento[];
  onClose: () => void;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export function CarteleraKiosko({ eventos, onClose }: Readonly<CarteleraKioskoProps>) {
  const lista = eventos.filter((e) => e.estado === 'PUBLICADO').sort((a, b) => a.inicio.localeCompare(b.inicio));
  const [idx, setIdx] = useState(0);
  const [qr, setQr] = useState<string | null>(null);
  const evento = lista[idx];

  useEffect(() => {
    if (lista.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % lista.length), 7000);
    return () => clearInterval(t);
  }, [lista.length]);

  useEffect(() => {
    if (!evento) return;
    QRCode.toDataURL(`${window.location.origin}/eventos/${evento.id}`, { margin: 1, width: 260 }).then(setQr).catch(() => setQr(null));
  }, [evento]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!evento) {
    return (
      <div className="fixed inset-0 z-[100] bg-chrome text-white flex items-center justify-center">
        <p className="text-white/70">No hay eventos publicados para mostrar.</p>
        <Button variant="secondary" size="sm" className="absolute top-5 right-5" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#184897,#0f2f63)' }}>
      <div className="absolute -top-20 -right-10 h-80 w-80 rounded-full bg-utec-green/20 blur-3xl" />
      <div className="absolute -bottom-24 left-20 h-96 w-96 rounded-full bg-utec-cyan/15 blur-3xl" />

      <Button variant="secondary" size="sm" className="absolute top-5 right-5 z-10" onClick={onClose}><X className="h-4 w-4 mr-1" />Salir</Button>

      <div className="absolute top-6 left-8 z-10">
        <p className="text-2xl font-bold">UTEC</p>
        <p className="text-sm text-white/60">Universidad Tecnológica · USM</p>
      </div>

      <div className="relative h-full flex items-center justify-center px-8">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center max-w-6xl w-full">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-utec-green px-4 py-1.5 text-sm font-semibold mb-5">{evento.tipo}</span>
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-5">{evento.titulo}</h1>
            {evento.descripcion && <p className="text-xl text-white/80 mb-6 line-clamp-3 max-w-2xl">{evento.descripcion}</p>}
            <p className="flex items-center gap-2 text-2xl text-utec-yellow font-semibold mb-2"><CalendarClock className="h-6 w-6" />{fmt(evento.inicio)}</p>
            {evento.espacioNombre && <p className="flex items-center gap-2 text-xl text-white/80"><MapPin className="h-5 w-5" />{evento.espacioNombre}</p>}
          </div>
          <div className="text-center">
            {qr && <img src={qr} alt="QR" className="h-56 w-56 rounded-2xl bg-card p-3 mx-auto" />}
            <p className="mt-4 text-lg font-semibold">Escaneá para inscribirte</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2">
        {lista.map((e, i) => <span key={e.id} className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-card' : 'w-2 bg-white/40'}`} />)}
      </div>
    </div>
  );
}
