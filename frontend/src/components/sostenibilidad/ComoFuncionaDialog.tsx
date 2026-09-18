import { Leaf } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export function ComoFuncionaDialog({ open, onOpenChange }: Readonly<{ open: boolean; onOpenChange: (v: boolean) => void }>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-utec-green/10 text-utec-green"><Leaf className="h-4 w-4" /></span>
            ¿Cómo se calcula?
          </DialogTitle>
          <DialogDescription>
            Las métricas son una <b>estimación derivada</b> de los recursos digitales — no son mediciones reales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm py-1">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="font-medium mb-1">La idea base</p>
            <p className="text-muted-foreground">Cada <b>archivo</b> subido a una materia evita que <b>cada estudiante inscripto</b> imprima una copia física. Los enlaces no cuentan para el papel (solo aparecen en el donut).</p>
          </div>

          <div>
            <p className="font-medium mb-1.5">1 · Hojas evitadas (por archivo)</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Hojas del recurso: usa <code>páginas estimadas</code>; si no, ~1 hoja por cada <b>50 KB</b>; si no hay datos, 1.</li>
              <li>× <b>copias evitadas</b> = cantidad de inscriptos en la materia (mínimo 1).</li>
              <li>Se suman todos los archivos → <b>hojas evitadas</b> totales.</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-1.5">2 · De hojas a impacto (factores fijos)</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <tbody className="[&_td]:px-3 [&_td]:py-1.5 [&_tr]:border-b [&_tr:last-child]:border-0">
                  <tr><td className="text-muted-foreground">Papel</td><td>hojas × 4,5 g</td><td className="text-right text-muted-foreground">4,5 g/hoja</td></tr>
                  <tr><td className="text-muted-foreground">CO₂</td><td>hojas × 4,7 g</td><td className="text-right text-muted-foreground">4,7 g/hoja</td></tr>
                  <tr><td className="text-muted-foreground">Agua</td><td>hojas × 10 L</td><td className="text-right text-muted-foreground">10 L/hoja</td></tr>
                  <tr><td className="text-muted-foreground">Árboles</td><td>papel ÷ 8,3 kg</td><td className="text-right text-muted-foreground">8,3 kg/árbol</td></tr>
                  <tr><td className="text-muted-foreground">Km en auto</td><td>CO₂ ÷ 0,12 kg</td><td className="text-right text-muted-foreground">0,12 kg/km</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="font-medium mb-1.5">3 · El resto</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><b>Meta:</b> árboles a salvar en el año; se edita desde la franja de arriba y queda guardada en este navegador.</li>
              <li><b>Equivalencias:</b> agua/CO₂ divididos por factores cotidianos (duchas, cargas de celular…).</li>
              <li><b>Por mes:</b> hojas de los recursos subidos cada mes; el mes en curso todavía no está completo.</li>
              <li><b>Ranking:</b> hojas agrupadas por carrera/docente de la materia.</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Los factores son constantes de referencia (aproximadas). Cuantos más recursos digitales se suban a materias con muchos inscriptos, mayor el ahorro estimado.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
