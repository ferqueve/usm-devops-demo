import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Loader2, QrCode } from 'lucide-react';

const RESERVA_RE = /reserva-?(\d+)/i;

/** QR de una reserva (encodea `reserva-<id>`) que el estudiante muestra para el check-in. */
export function ReservaQR({ reservaId, nombre }: Readonly<{ reservaId: number; nombre: string }>) {
  const [src, setSrc] = useState<string | null>(null);
  return (
    <Popover onOpenChange={(o) => { if (o && !src) QRCode.toDataURL(`reserva-${reservaId}`, { margin: 1, width: 220 }).then(setSrc).catch(() => { /* noop */ }); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="QR de la reserva"><QrCode className="h-3.5 w-3.5" /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 text-center">
        {src ? <img src={src} alt="QR de la reserva" className="h-40 w-40" /> : <div className="flex h-40 w-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
        {nombre && <p className="mt-2 text-xs font-medium">{nombre}</p>}
        <p className="text-[10px] text-muted-foreground">Mostralo para el check-in</p>
      </PopoverContent>
    </Popover>
  );
}

interface ScannerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDetect: (reservaId: number) => void;
}

/** Escáner de QR por cámara (BarcodeDetector nativo) con fallback de ingreso manual. */
export function CheckinScanner({ open, onOpenChange, onDetect }: Readonly<ScannerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!open) { setError(null); setManual(''); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BD = (window as any).BarcodeDetector;
    if (!BD) { setSupported(false); return; }
    setSupported(true);

    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const detector = new BD({ formats: ['qr_code'] });

    const tick = async () => {
      if (stopped || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const c of codes as any[]) {
          const m = RESERVA_RE.exec(c.rawValue ?? '');
          if (m) { onDetect(Number(m[1])); onOpenChange(false); return; }
        }
      } catch { /* frame sin código */ }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        raf = requestAnimationFrame(tick);
      } catch { setError('No se pudo acceder a la cámara. Revisá los permisos del navegador.'); }
    })();

    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [open, onDetect, onOpenChange]);

  const submitManual = () => {
    const m = /(\d+)/.exec(manual);
    if (m) { onDetect(Number(m[1])); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-utec-blue/10 text-utec-blue"><QrCode className="h-4 w-4" /></span>Check-in por QR</DialogTitle>
          <DialogDescription>Apuntá la cámara al QR que muestra el estudiante.</DialogDescription>
        </DialogHeader>

        {supported && !error && (
          <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/70" />
          </div>
        )}
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {!supported && <p className="text-sm text-muted-foreground">Tu navegador no soporta escaneo por cámara. Ingresá el N° de reserva manualmente.</p>}

        <div className="flex items-center gap-2 pt-1">
          <Input placeholder="N° de reserva (manual)" value={manual} onChange={(e) => setManual(e.target.value)} className="h-9" />
          <Button onClick={submitManual} disabled={!/\d/.test(manual)}>Marcar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
