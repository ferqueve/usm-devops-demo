"""Tests del pronóstico. Corren con pytest o con la biblioteca estándar:

    python -m pytest test_forecaster.py
    python -m unittest test_forecaster
"""

import logging
import unittest
from datetime import date, timedelta

import numpy as np
import pandas as pd

from forecaster import (
    MIN_DIAS_CON_DATOS_POR_TIPO,
    _calcular_wape,
    _recortar,
    entrenar_y_predecir,
    extender_hasta,
    motivo_omision_tipo,
    preparar_serie,
)

logging.getLogger("cmdstanpy").setLevel(logging.ERROR)


def serie_semanal(dias: int, desde: str = "2026-01-05", nivel: float = 40.0) -> pd.DataFrame:
    """Demanda con patrón lunes-viernes y fines de semana flojos, sin los días en cero."""
    fechas = pd.date_range(desde, periods=dias, freq="D")
    rng = np.random.default_rng(7)
    y = [nivel + rng.normal(0, 2) if f.weekday() < 5 else 0.0 for f in fechas]
    df = pd.DataFrame({"ds": fechas, "y": y})
    # Como la tabla de hechos: los días sin reservas no tienen fila.
    return df[df["y"] > 0].reset_index(drop=True)


class PrepararSerieTest(unittest.TestCase):
    def test_completa_los_dias_sin_reservas_con_cero(self):
        serie = preparar_serie(serie_semanal(14))

        self.assertEqual(len(serie), 12)  # del primer lunes al último viernes
        domingos = serie[serie["ds"].dt.weekday == 6]
        self.assertTrue((domingos["y"] == 0).all())

    def test_deja_afuera_hoy_y_lo_que_viene(self):
        serie = preparar_serie(serie_semanal(30), hasta=date(2026, 1, 20))

        self.assertEqual(serie["ds"].max(), pd.Timestamp("2026-01-19"))


class ExtenderHastaTest(unittest.TestCase):
    def test_estira_con_cero_hasta_el_ultimo_dia_del_campus(self):
        # El tipo dejó de tener reservas el viernes 16; el campus tiene datos hasta el 20.
        serie = preparar_serie(extender_hasta(serie_semanal(12), date(2026, 1, 20)))

        self.assertEqual(serie["ds"].max(), pd.Timestamp("2026-01-20"))
        self.assertTrue((serie[serie["ds"] > pd.Timestamp("2026-01-16")]["y"] == 0).all())

    def test_no_estira_hacia_atras_ni_si_ya_llega(self):
        original = serie_semanal(12)
        serie = extender_hasta(original, date(2026, 1, 10))

        self.assertEqual(len(serie), len(original))
        self.assertEqual(serie["ds"].min(), original["ds"].min())

    def test_sin_fecha_o_sin_datos_no_hace_nada(self):
        vacia = pd.DataFrame(columns=["ds", "y"])
        self.assertTrue(extender_hasta(vacia, date(2026, 1, 20)).empty)
        self.assertEqual(len(extender_hasta(serie_semanal(12), None)), len(serie_semanal(12)))


class MotivoOmisionTipoTest(unittest.TestCase):
    def test_con_pocos_dias_con_reservas_se_omite(self):
        serie = preparar_serie(serie_semanal(20))  # 15 días hábiles

        motivo = motivo_omision_tipo(serie)
        self.assertIsNotNone(motivo)
        self.assertIn(str(MIN_DIAS_CON_DATOS_POR_TIPO), motivo)

    def test_con_menos_de_una_reserva_por_dia_se_omite(self):
        fechas = pd.date_range("2026-01-01", periods=120, freq="D")
        # Una reserva cada tres días: 40 días con datos pero 0.33 por día.
        serie = preparar_serie(pd.DataFrame({"ds": fechas[::3], "y": 1.0}))

        motivo = motivo_omision_tipo(serie)
        self.assertIsNotNone(motivo)
        self.assertIn("por día", motivo)

    def test_sin_reservas_se_omite(self):
        self.assertIsNotNone(motivo_omision_tipo(pd.DataFrame(columns=["ds", "y"])))

    def test_con_historia_suficiente_no_se_omite(self):
        self.assertIsNone(motivo_omision_tipo(preparar_serie(serie_semanal(90))))


class WapeTest(unittest.TestCase):
    def test_pesa_por_volumen_y_no_existe_sin_volumen(self):
        self.assertAlmostEqual(_calcular_wape(np.array([1.0, 99.0]), np.array([2.0, 99.0])), 1.0)
        self.assertIsNone(_calcular_wape(np.zeros(3), np.ones(3)))


class RecortarTest(unittest.TestCase):
    def test_la_banda_contiene_a_la_prediccion_aunque_prophet_la_invierta(self):
        # Lo que devolvía el modelo con 37 días: banda superior negativa.
        pred, inferior, superior = _recortar(-3.0, -20.0, -2203.0)

        self.assertEqual(pred, 0.0)
        self.assertLessEqual(inferior, pred)
        self.assertGreaterEqual(superior, pred)

    def test_no_toca_una_banda_valida(self):
        self.assertEqual(_recortar(30.0, 20.0, 40.0), (30.0, 20.0, 40.0))


class EntrenarTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.resultado = entrenar_y_predecir(serie_semanal(140), hoy=date(2026, 6, 1), horizonte_dias=14)

    def test_no_activa_la_estacionalidad_anual_sin_dos_anos(self):
        self.assertFalse(self.resultado.params["yearly_seasonality"])

    def test_el_horizonte_arranca_el_dia_siguiente_al_ultimo_dato(self):
        primera = self.resultado.predicciones[0]["fecha_objetivo"]
        ultimo_dato = date.fromisoformat(self.resultado.params["hasta"])
        self.assertEqual(primera, ultimo_dato + timedelta(days=1))

    def test_las_bandas_quedan_ordenadas(self):
        for p in self.resultado.predicciones:
            self.assertLessEqual(p["banda_inferior"], p["prediccion"])
            self.assertLessEqual(p["prediccion"], p["banda_superior"])

    def test_aprende_el_fin_de_semana(self):
        por_dia = {p["fecha_objetivo"].weekday(): p["prediccion"] for p in self.resultado.predicciones}
        self.assertLess(por_dia[6], por_dia[2] / 2)

    def test_params_con_las_claves_comunes_a_todos_los_modelos(self):
        params = self.resultado.params
        self.assertEqual(params["estacionalidad_anual"], params["yearly_seasonality"])
        self.assertEqual(params["historico_desde"], params["desde"])
        self.assertEqual(params["historico_hasta"], params["hasta"])
        for clave in ("wape", "wape_ingenuo", "validacion"):
            self.assertIn(clave, params)

    def test_la_referencia_no_usa_datos_del_periodo_validado(self):
        # Repite la última semana ANTES del holdout: sus siete primeros días y
        # los siete siguientes tienen que ser iguales.
        ingenuo = [v["ingenuo"] for v in self.resultado.params["validacion"]]
        self.assertEqual(ingenuo[:7], ingenuo[7:14])


if __name__ == "__main__":
    unittest.main()
