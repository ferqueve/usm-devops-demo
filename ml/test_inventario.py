"""Tests del modelo de demanda de equipamiento.

    python -m pytest test_inventario.py
"""

from __future__ import annotations

import unittest
from datetime import date, timedelta

import numpy as np
import pandas as pd
from inventario import (
    MIN_DIAS_CON_PEDIDOS,
    bandas,
    entrenar_y_predecir_inventario,
    estimar_alpha,
    ingenuo,
    picos_diarios,
    serie_de_tipo,
)

MVD = "America/Montevideo"


def solicitud(tipo: int, dia: str, desde: str, hasta: str, cantidad: int, hasta_dia: str | None = None) -> dict:
    """Una solicitud con horas locales de Montevideo."""
    return {
        "tipo_elemento_id": tipo,
        "inicio": pd.Timestamp(f"{dia} {desde}", tz=MVD),
        "fin": pd.Timestamp(f"{hasta_dia or dia} {hasta}", tz=MVD),
        "cantidad": cantidad,
    }


def picos(filas: list[dict]) -> dict[tuple[int, str], int]:
    df = picos_diarios(pd.DataFrame(filas))
    return {(int(r.tipo_elemento_id), r.fecha.date().isoformat()): int(r.pico) for r in df.itertuples()}


class PicosDiariosTest(unittest.TestCase):
    def test_suma_las_que_se_superponen(self):
        # 11:00-12:00 están A y B (2 + 3); después B y C (3 + 1).
        resultado = picos(
            [
                solicitud(1, "2026-09-01", "10:00", "12:00", 2),
                solicitud(1, "2026-09-01", "11:00", "13:00", 3),
                solicitud(1, "2026-09-01", "12:30", "14:00", 1),
            ]
        )
        self.assertEqual(resultado, {(1, "2026-09-01"): 5})

    def test_no_suma_las_que_estan_en_el_dia_pero_no_a_la_vez(self):
        # Diez proyectores de 8 a 9 y diez de 10 a 11 son diez, no veinte.
        resultado = picos(
            [
                solicitud(1, "2026-09-01", "08:00", "09:00", 10),
                solicitud(1, "2026-09-01", "10:00", "11:00", 10),
            ]
        )
        self.assertEqual(resultado[(1, "2026-09-01")], 10)

    def test_la_que_termina_cuando_empieza_otra_no_se_superpone(self):
        resultado = picos(
            [
                solicitud(1, "2026-09-01", "10:00", "11:00", 2),
                solicitud(1, "2026-09-01", "11:00", "12:00", 3),
            ]
        )
        self.assertEqual(resultado[(1, "2026-09-01")], 3)

    def test_cada_tipo_tiene_su_propio_pico(self):
        resultado = picos(
            [
                solicitud(1, "2026-09-01", "10:00", "12:00", 2),
                solicitud(2, "2026-09-01", "10:00", "12:00", 7),
            ]
        )
        self.assertEqual(resultado, {(1, "2026-09-01"): 2, (2, "2026-09-01"): 7})

    def test_el_dia_es_el_de_montevideo_y_no_el_de_utc(self):
        # 22:30 en Montevideo ya es el día siguiente en UTC.
        resultado = picos([solicitud(1, "2026-09-01", "22:30", "23:30", 4)])
        self.assertEqual(resultado, {(1, "2026-09-01"): 4})

    def test_la_que_cruza_la_medianoche_cuenta_en_los_dos_dias(self):
        resultado = picos(
            [
                solicitud(1, "2026-09-01", "23:00", "01:00", 2, hasta_dia="2026-09-02"),
                solicitud(1, "2026-09-02", "00:30", "01:30", 1),
            ]
        )
        self.assertEqual(resultado, {(1, "2026-09-01"): 2, (1, "2026-09-02"): 3})

    def test_una_solicitud_con_el_fin_roto_igual_cuenta(self):
        resultado = picos([solicitud(1, "2026-09-01", "10:00", "09:00", 3)])
        self.assertEqual(resultado[(1, "2026-09-01")], 3)

    def test_sin_solicitudes_devuelve_vacio(self):
        self.assertTrue(picos_diarios(pd.DataFrame(columns=["tipo_elemento_id", "inicio", "fin", "cantidad"])).empty)


class SerieDeTipoTest(unittest.TestCase):
    def test_los_dias_sin_pedidos_son_cero(self):
        df = picos_diarios(
            pd.DataFrame(
                [
                    solicitud(1, "2026-09-01", "10:00", "11:00", 2),
                    solicitud(1, "2026-09-04", "10:00", "11:00", 5),
                    solicitud(2, "2026-09-02", "10:00", "11:00", 9),
                ]
            )
        )
        fechas = pd.date_range("2026-09-01", "2026-09-05", freq="D")
        np.testing.assert_array_equal(serie_de_tipo(df, 1, fechas), [2, 0, 0, 5, 0])


class BandasTest(unittest.TestCase):
    MEDIAS = np.array([0.0, 0.01, 0.3, 1.0, 2.5, 7.1, 40.0])

    def _chequear(self, alpha: float):
        inferior, superior = bandas(self.MEDIAS, alpha)
        self.assertTrue((inferior >= 0).all())
        self.assertTrue((inferior <= self.MEDIAS).all())
        self.assertTrue((self.MEDIAS <= superior).all())

    def test_poisson_ordenadas_y_sin_negativos(self):
        self._chequear(0.0)

    def test_binomial_negativa_ordenadas_y_sin_negativos(self):
        self._chequear(0.5)

    def test_la_sobredispersion_ensancha_la_banda(self):
        inf_p, sup_p = bandas(np.array([10.0]), 0.0)
        inf_nb, sup_nb = bandas(np.array([10.0]), 0.8)
        self.assertGreater(sup_nb[0] - inf_nb[0], sup_p[0] - inf_p[0])

    def test_cubre_cerca_del_80_por_ciento(self):
        rng = np.random.default_rng(3)
        mu, alpha = 6.0, 0.4
        n = 1 / alpha
        muestras = rng.negative_binomial(n, n / (n + mu), size=20000)
        inferior, superior = bandas(np.array([mu]), alpha)
        cobertura = np.mean((muestras >= inferior[0]) & (muestras <= superior[0]))
        # Discreto: los cuantiles enteros cubren un poco más que el 80% nominal.
        self.assertGreaterEqual(cobertura, 0.78)
        self.assertLessEqual(cobertura, 0.92)


class EstimarAlphaTest(unittest.TestCase):
    def test_nunca_negativo_con_datos_menos_dispersos_que_poisson(self):
        mu = np.full(100, 4.0)
        y = np.full(100, 4.0)
        self.assertEqual(estimar_alpha(y, mu), 0.0)

    def test_sin_media_no_hay_dispersion(self):
        self.assertEqual(estimar_alpha(np.zeros(10), np.zeros(10)), 0.0)

    def test_recupera_la_sobredispersion_de_una_binomial_negativa(self):
        rng = np.random.default_rng(11)
        mu, alpha = 5.0, 0.5
        n = 1 / alpha
        y = rng.negative_binomial(n, n / (n + mu), size=20000)
        estimado = estimar_alpha(y, np.full(y.shape, mu))
        self.assertGreaterEqual(estimado, 0.0)
        self.assertAlmostEqual(estimado, alpha, delta=0.1)

    def test_poisson_da_alpha_cercano_a_cero(self):
        rng = np.random.default_rng(5)
        y = rng.poisson(5.0, size=20000)
        self.assertLess(estimar_alpha(y, np.full(y.shape, 5.0)), 0.03)


class IngenuoTest(unittest.TestCase):
    def test_repite_la_ultima_semana_de_entrenamiento(self):
        entrenamiento = np.arange(1, 22, dtype=float)  # 21 días: la última semana es 15..21
        referencia = ingenuo(entrenamiento, 28)
        np.testing.assert_array_equal(referencia[:7], [15, 16, 17, 18, 19, 20, 21])
        np.testing.assert_array_equal(referencia[7:14], referencia[:7])
        self.assertEqual(len(referencia), 28)


def historia_sintetica(hoy: date, dias: int = 120) -> pd.DataFrame:
    """Dos tipos con patrón semanal, uno casi sin pedidos y pedidos ya hechos para la semana que viene."""
    rng = np.random.default_rng(21)
    filas = []
    for d in range(dias, 0, -1):
        dia = hoy - timedelta(days=d)
        habil = dia.weekday() < 5
        # Tipo 1: proyectores, fuerte de lunes a viernes.
        for _ in range(rng.poisson(6 if habil else 1)):
            h = int(rng.integers(8, 20))
            filas.append(solicitud(1, dia.isoformat(), f"{h:02d}:00", f"{h + 1:02d}:00", int(rng.integers(1, 3))))
        # Tipo 2: pantallas, parejo toda la semana.
        for _ in range(rng.poisson(3)):
            h = int(rng.integers(8, 20))
            filas.append(solicitud(2, dia.isoformat(), f"{h:02d}:00", f"{h + 2:02d}:00", 1))
    # Tipo 3: sólo unos pocos días con pedidos.
    for d in range(1, MIN_DIAS_CON_PEDIDOS // 2):
        filas.append(solicitud(3, (hoy - timedelta(days=d * 5)).isoformat(), "10:00", "11:00", 1))
    # Lo que ya está pedido para dentro de dos días: dos superpuestas.
    en_dos_dias = (hoy + timedelta(days=2)).isoformat()
    filas.append(solicitud(1, en_dos_dias, "10:00", "12:00", 4))
    filas.append(solicitud(1, en_dos_dias, "11:00", "13:00", 3))
    return pd.DataFrame(filas)


class EntrenarInventarioTest(unittest.TestCase):
    HOY = date(2026, 9, 14)

    @classmethod
    def setUpClass(cls):
        cls.resultado = entrenar_y_predecir_inventario(
            historia_sintetica(cls.HOY),
            {1: "Proyector", 2: "Pantalla", 3: "Parlante"},
            hoy=cls.HOY,
        )
        cls.por_tipo = {t["tipo_elemento_id"]: t for t in cls.resultado.tipos}

    def test_omite_el_tipo_con_pocos_dias_de_pedidos_sin_frenar_a_los_demas(self):
        self.assertEqual(self.por_tipo[3]["status"], "omitido")
        self.assertIsNotNone(self.por_tipo[3]["detalle"])
        self.assertEqual(self.por_tipo[1]["status"], "ok")
        self.assertEqual(self.por_tipo[2]["status"], "ok")
        tipos_predichos = {p["tipo_elemento_id"] for p in self.resultado.predicciones}
        self.assertEqual(tipos_predichos, {1, 2})

    def test_predice_30_dias_desde_hoy(self):
        fechas = sorted({p["fecha_objetivo"] for p in self.resultado.predicciones})
        self.assertEqual(fechas[0], self.HOY)
        self.assertEqual(len(fechas), 30)
        self.assertEqual(len(self.resultado.predicciones), 60)

    def test_bandas_ordenadas_y_sin_negativos(self):
        for p in self.resultado.predicciones:
            self.assertGreaterEqual(p["banda_inferior"], 0)
            self.assertLessEqual(p["banda_inferior"], p["prediccion"])
            self.assertLessEqual(p["prediccion"], p["banda_superior"])

    def test_comprometidas_es_el_pico_de_lo_ya_pedido(self):
        dia = self.HOY + timedelta(days=2)
        por_fecha = {
            p["fecha_objetivo"]: p["comprometidas"] for p in self.resultado.predicciones if p["tipo_elemento_id"] == 1
        }
        self.assertEqual(por_fecha[dia], 7)
        self.assertEqual(por_fecha[self.HOY], 0)

    def test_el_historico_termina_antes_de_hoy(self):
        # Lo pedido para dentro de dos días no es historia.
        self.assertLess(date.fromisoformat(self.resultado.params["historico_hasta"]), self.HOY)

    def test_aprende_que_el_fin_de_semana_se_pide_menos(self):
        mult = self.resultado.params["tipos"]["1"]["coef_dia_semana"]
        self.assertEqual(len(mult), 7)
        self.assertLess(max(mult[5], mult[6]), min(mult[:5]))
        self.assertAlmostEqual(float(np.mean(mult)), 1.0, places=2)

    def test_params_con_las_claves_del_contrato(self):
        params = self.resultado.params
        for clave in ("horizonte_dias", "holdout_dias", "intervalo", "historico_desde", "historico_hasta", "wape",
                      "wape_ingenuo", "tipos"):
            self.assertIn(clave, params)
        for clave in ("nombre", "alpha", "wape", "wape_ingenuo", "media_historica", "coef_dia_semana",
                      "tendencia_semanal_pct", "status", "detalle"):
            self.assertIn(clave, params["tipos"]["1"])
            self.assertIn(clave, params["tipos"]["3"])
        self.assertGreaterEqual(params["tipos"]["1"]["alpha"], 0)
        self.assertEqual(params["holdout_dias"], 28)
        self.assertEqual(params["intervalo"], 0.8)

    def test_informa_wape_del_modelo_y_del_ingenuo(self):
        self.assertIsNotNone(self.resultado.wape)
        self.assertIsNotNone(self.resultado.wape_ingenuo)
        self.assertIsNotNone(self.por_tipo[1]["wape"])

    def test_sin_pedidos_no_entrena(self):
        with self.assertRaises(ValueError):
            entrenar_y_predecir_inventario(
                pd.DataFrame(columns=["tipo_elemento_id", "inicio", "fin", "cantidad"]), {1: "Proyector"}, hoy=self.HOY
            )

    def test_si_ningun_tipo_alcanza_no_entrena(self):
        filas = [
            solicitud(1, (self.HOY - timedelta(days=d * 3)).isoformat(), "10:00", "11:00", 1) for d in range(1, 15)
        ]
        with self.assertRaises(ValueError):
            entrenar_y_predecir_inventario(pd.DataFrame(filas), {1: "Proyector"}, hoy=self.HOY)


if __name__ == "__main__":
    unittest.main()
