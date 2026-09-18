import { useCallback, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import type { Evento } from '@/lib/types/eventos';
import { MARCA } from '@/lib/design/paleta';

interface AfichePosterProps {
  evento: Evento;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const W = 820;
const H = 1040;

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

function formatFechaLarga(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export function AfichePoster({ evento, open, onOpenChange }: Readonly<AfichePosterProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo: gradiente UTEC
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, MARCA.azul);
    grad.addColorStop(1, '#0f2f63');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Acentos circulares
    ctx.fillStyle = 'rgba(134,187,76,0.18)';
    ctx.beginPath(); ctx.arc(W - 60, 90, 160, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,199,255,0.14)';
    ctx.beginPath(); ctx.arc(80, H - 120, 200, 0, Math.PI * 2); ctx.fill();

    // Header UTEC
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Poppins, sans-serif';
    ctx.fillText('UTEC', 60, 90);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '20px Poppins, sans-serif';
    ctx.fillText('Universidad Tecnológica · USM', 60, 120);

    // Tipo (chip)
    const tipo = evento.tipo === 'CURSO' ? 'CURSO' : 'EVENTO';
    ctx.font = 'bold 18px Poppins, sans-serif';
    const chipW = ctx.measureText(tipo).width + 36;
    ctx.fillStyle = MARCA.verde;
    ctx.beginPath(); ctx.roundRect(60, 180, chipW, 40, 20); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tipo, 78, 207);

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px Poppins, sans-serif';
    const afterTitle = wrapText(ctx, evento.titulo, 60, 300, W - 120, 66);

    // Descripción
    if (evento.descripcion) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '26px Poppins, sans-serif';
      wrapText(ctx, evento.descripcion, 60, afterTitle + 56, W - 120, 36);
    }

    // Fecha + lugar
    let infoY = Math.max(afterTitle + 180, 560);
    ctx.fillStyle = MARCA.amarillo;
    ctx.font = 'bold 30px Poppins, sans-serif';
    ctx.fillText('🗓  ' + formatFechaLarga(evento.inicio), 60, infoY);
    if (evento.espacioNombre) {
      infoY += 48;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '26px Poppins, sans-serif';
      ctx.fillText('📍  ' + evento.espacioNombre, 60, infoY);
    }
    if (evento.organizadorNombre) {
      infoY += 42;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '22px Poppins, sans-serif';
      ctx.fillText('Organiza: ' + evento.organizadorNombre, 60, infoY);
    }

    // QR (abajo a la derecha)
    try {
      const qrData = await QRCode.toDataURL(window.location.href, { margin: 1, width: 220 });
      const img = new Image();
      await new Promise<void>((res) => { img.onload = () => res(); img.src = qrData; });
      const qrX = W - 240 - 60;
      const qrY = H - 240 - 60;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(qrX - 16, qrY - 16, 252, 252, 16); ctx.fill();
      ctx.drawImage(img, qrX, qrY, 220, 220);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Poppins, sans-serif';
      ctx.fillText('Escaneá para', 60, H - 150);
      ctx.fillText('inscribirte', 60, H - 116);
    } catch { /* sin QR */ }
  }, [evento]);

  useEffect(() => {
    if (open) {
      // pequeño delay para asegurar fuentes
      const t = setTimeout(() => { draw().catch(() => { /* noop */ }); }, 60);
      return () => clearTimeout(t);
    }
  }, [open, draw]);

  const descargarPNG = () => {
    const url = canvasRef.current?.toDataURL('image/png');
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `afiche-${evento.id}.png`; a.click();
  };
  const descargarPDF = () => {
    const url = canvasRef.current?.toDataURL('image/png');
    if (!url) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [W, H] });
    doc.addImage(url, 'PNG', 0, 0, W, H);
    doc.save(`afiche-${evento.id}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-utec-cyan/10 text-marca-cian-texto"><ImageIcon className="h-4 w-4" /></span>Afiche del evento</DialogTitle>
          <DialogDescription>Generado con el branding UTEC y un QR a la página del evento.</DialogDescription>
        </DialogHeader>
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          <canvas ref={canvasRef} width={W} height={H} className="w-full h-auto block" />
          {!canvasRef.current && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={descargarPDF}><Download className="h-4 w-4 mr-1.5" />PDF</Button>
          <Button onClick={descargarPNG}><Download className="h-4 w-4 mr-1.5" />PNG</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
