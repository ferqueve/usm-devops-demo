import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { academico } from './datosPredicciones';

const api = vi.hoisted(() => ({ academicoML: vi.fn() }));
vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
const ai = vi.hoisted(() => ({ postAnalyzeAsistencia: vi.fn() }));
vi.mock('@/lib/api/ai', () => ai);
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light' }) }));
vi.mock('@/components/ui/backgrounds/eventPatterns', () => ({ EventoPatternBg: () => null }));
vi.mock('recharts', async () => (await import('./mocks')).rechartsFalso());

import PrediccionesAcademico from '@/components/predicciones/academico/PrediccionesAcademico';

const entrenar = vi.fn();
function montar() {
  return render(
    <MemoryRouter initialEntries={['/predicciones?tab=academico']}>
      <PrediccionesAcademico version={0} entrenamiento={{ esAdmin: true, reentrenando: false, entrenar }} />
    </MemoryRouter>,
  );
}

const AVISO = 'El modelo todavía no predice mejor que el promedio.';

describe('PrediccionesAcademico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.academicoML.mockResolvedValue({ success: true, data: academico });
    ai.postAnalyzeAsistencia.mockResolvedValue({ success: true, data: { analisis: 'Física II va a quedar vacía.' } });
  });

  it('lista las próximas con su riesgo, y el filtro deja ver sólo las que preocupan', async () => {
    montar();
    expect(await screen.findByRole('heading', { name: /^Se esperan \d+ asistentes en 3 tutorías$/ })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).not.toBeInTheDocument();
    const lista = screen.getByRole('heading', { name: 'Tutorías que vienen' }).closest('section')!;
    expect(within(lista).getByText('Cálculo I')).toBeInTheDocument();
    expect(within(lista).getByText('Física II')).toBeInTheDocument();
    expect(within(lista).getByText('Programación')).toBeInTheDocument();
    expect(within(lista).getByText('Casi vacía')).toBeInTheDocument();
    // Una en el filtro y otra en la fila.
    expect(within(lista).getAllByText('Sin predicción')).toHaveLength(2);
    expect(within(lista).getByText('4,6')).toBeInTheDocument();

    fireEvent.click(within(lista).getByRole('radio', { name: /Casi vacías/ }));
    expect(within(lista).queryByText('Cálculo I')).not.toBeInTheDocument();
    expect(within(lista).getByText('Física II')).toBeInTheDocument();
  });

  it('abre una tutoría con la probabilidad de cada inscripto', async () => {
    montar();
    fireEvent.click(await screen.findByRole('button', { name: /Cálculo I/ }));
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('Estudiante 4')).toBeInTheDocument();
    expect(within(dialogo).getByText('81%')).toBeInTheDocument();
    expect(within(dialogo).getByText('fue a 5 de 6 anteriores')).toBeInTheDocument();
    expect(within(dialogo).getByText('primera tutoría')).toBeInTheDocument();
    // Ordenados de más a menos probable.
    const nombres = within(dialogo).getAllByText(/^Estudiante \d+$/).map((n) => n.textContent);
    expect(nombres).toEqual(['Estudiante 4', 'Estudiante 9']);
  });

  it('qué influye: odds ratios con su efecto contado en palabras', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Qué influye' });
    const influye = screen.getByRole('heading', { name: 'Qué influye' }).closest('section')!;
    expect(within(influye).getByText('×1,90')).toBeInTheDocument();
    expect(within(influye).getByText('×0,70')).toBeInTheDocument();
    const palabras = screen.getByRole('heading', { name: 'En palabras' }).closest('section')!;
    expect(within(palabras).getByText(/las chances de ir bajan un/)).toBeInTheDocument();
    expect(within(palabras).getByText(/Casi no pesan: tiene temario/)).toBeInTheDocument();
  });

  it('con un modelo bueno no hay aviso', async () => {
    montar();
    await screen.findByRole('heading', { name: '¿Distingue quién va?' });
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
    expect(screen.getByText(/le da más chance al que fue/)).toBeInTheDocument();
  });

  it('avisa sin vueltas si el AUC es menor a 0,6', async () => {
    api.academicoML.mockResolvedValue({ success: true, data: { ...academico, modelo: { ...academico.modelo, auc: 0.55 } } });
    montar();
    expect(await screen.findByText(AVISO)).toBeInTheDocument();
    expect(screen.getByText(/casi como tirar una moneda/)).toBeInTheDocument();
  });

  it('avisa si el Brier no mejora al de la base', async () => {
    api.academicoML.mockResolvedValue({ success: true, data: { ...academico, modelo: { ...academico.modelo, brier: 0.25, brierBase: 0.247 } } });
    montar();
    expect(await screen.findByText(AVISO)).toBeInTheDocument();
    expect(screen.getByText('No mejora al promedio')).toBeInTheDocument();
  });

  it('sin tutorías futuras lo dice, y muestra igual lo que aprendió', async () => {
    api.academicoML.mockResolvedValue({
      success: true,
      data: { ...academico, proximas: [], resumen: { proximas: 0, inscriptos: 0, esperados: 0, tasaEsperada: null, enRiesgoVacias: 0, desbordadas: 0 } },
    });
    montar();
    expect(await screen.findByRole('heading', { name: 'No hay tutorías próximas', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qué influye' })).toBeInTheDocument();
    expect(screen.queryByText('Tutorías que vienen')).not.toBeInTheDocument();
  });

  it('sin modelo entrenado, ofrece entrenarlo', async () => {
    api.academicoML.mockResolvedValue({ success: true, data: { modelo: { entrenado: false }, proximas: [] } });
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Entrenar el modelo académico' }));
    expect(entrenar).toHaveBeenCalled();
  });

  it('la lectura con IA manda primero las tutorías que piden acción', async () => {
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Analizar con IA' }));
    expect(await screen.findByText('Física II va a quedar vacía.')).toBeInTheDocument();
    const pedido = ai.postAnalyzeAsistencia.mock.calls[0][0];
    expect(pedido).toMatchObject({ auc: 0.71, tasaBase: 0.55 });
    expect(pedido.proximas[0].riesgo).not.toBe('normal');
    expect(pedido.proximas.at(-1).materia).toBe('Cálculo I');
    expect(pedido.factores).toContainEqual({ nombre: 'Asistencia previa del estudiante', oddsRatio: 1.9 });
  });
});
