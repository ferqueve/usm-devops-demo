"""Tests del modelo de asistencia a tutorías.

    python -m pytest test_academico.py
"""

from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta

import numpy as np
import pandas as pd
from academico import (
    CLAVES,
    K_SUAVIZADO,
    calibracion,
    construir_features,
    dividir_temporal,
    entrenar_y_predecir_asistencia,
    metricas,
    preparar_inscripciones,
    tasas_previas,
)

AHORA = datetime(2026, 9, 14, 23, 0, tzinfo=UTC)


def inscripcion(
    id_: int,
    tutoria: int,
    estudiante: int,
    inicio: datetime,
    estado: str = "AGENDADA",
    *,
    materia: int = 1,
    horas: float = 1.0,
    antelacion_h: float = 24.0,
    cupo: int = 10,
    modalidad: str = "PRESENCIAL",
    tipo: str = "GRUPAL",
    temario: str | None = "Dudas",
    tutoria_estado: str = "ABIERTA",
    confirmada: bool = False,
) -> dict:
    return {
        "tutoria_reserva_id": id_,
        "tutoria_id": tutoria,
        "estudiante_id": estudiante,
        "materia_id": materia,
        "inicio": pd.Timestamp(inicio),
        "fin": pd.Timestamp(inicio + timedelta(hours=horas)),
        "cupo": cupo,
        "modalidad": modalidad,
        "tipo": tipo,
        "created_at": pd.Timestamp(inicio - timedelta(hours=antelacion_h)),
        "temario": temario,
        "estado": estado,
        "tutoria_estado": tutoria_estado,
        "confirmada": confirmada,
    }


def dia(n: int, hora: int = 19) -> datetime:
    return datetime(2026, 8, 1, hora, 0, tzinfo=UTC) + timedelta(days=n)


class TasasPreviasTest(unittest.TestCase):
    BASE = 0.5

    def historia(self):
        # Mismo estudiante en tres tutorías sucesivas: fue, no fue, fue.
        filas = [
            inscripcion(1, 10, 7, dia(0), "ASISTIO"),
            inscripcion(2, 11, 7, dia(1), "AGENDADA"),
            inscripcion(3, 12, 7, dia(2), "ASISTIO"),
        ]
        df = pd.DataFrame(filas)
        df["y"] = (df["estado"] == "ASISTIO").astype(int)
        return df

    def test_ninguna_fila_ve_su_propia_etiqueta(self):
        h = self.historia()
        tasa, n_prev = tasas_previas(h, h, "estudiante_id", self.BASE)
        k = K_SUAVIZADO
        np.testing.assert_array_equal(n_prev, [0, 1, 2])
        np.testing.assert_allclose(tasa, [self.BASE, (1 + k * self.BASE) / (1 + k), (1 + k * self.BASE) / (2 + k)])

    def test_cambiar_una_etiqueta_futura_no_cambia_las_features_pasadas(self):
        h = self.historia()
        antes, _ = tasas_previas(h, h, "estudiante_id", self.BASE)
        h.loc[2, "y"] = 0
        h.loc[1, "y"] = 1
        despues, _ = tasas_previas(h, h, "estudiante_id", self.BASE)
        # La primera fila no ve ninguna; la segunda sólo la primera.
        self.assertEqual(antes[0], despues[0])
        self.assertEqual(antes[1], despues[1])

    def test_tutorias_simultaneas_no_se_ven_entre_si(self):
        filas = [inscripcion(1, 10, 7, dia(0), "ASISTIO"), inscripcion(2, 11, 7, dia(0), "AGENDADA")]
        h = pd.DataFrame(filas).assign(y=[1, 0])
        _, n_prev = tasas_previas(h, h, "estudiante_id", self.BASE)
        np.testing.assert_array_equal(n_prev, [0, 0])

    def test_una_tutoria_que_no_habia_terminado_cuando_empezo_la_fila_no_cuenta(self):
        # La primera dura 3 horas y la segunda empieza una hora después.
        filas = [
            inscripcion(1, 10, 7, dia(0, 10), "ASISTIO", horas=3),
            inscripcion(2, 11, 7, dia(0, 11), "AGENDADA"),
        ]
        h = pd.DataFrame(filas).assign(y=[1, 0])
        _, n_prev = tasas_previas(h, h, "estudiante_id", self.BASE)
        self.assertEqual(n_prev[1], 0)

    def test_el_corte_esconde_lo_que_todavia_no_se_sabia(self):
        h = self.historia()
        _, n_prev = tasas_previas(h, h, "estudiante_id", self.BASE, corte=pd.Timestamp(dia(1)))
        # Con el corte al inicio de la segunda, la tercera sólo puede ver la primera.
        self.assertEqual(n_prev[2], 1)

    def test_otro_estudiante_no_suma(self):
        h = self.historia()
        fila = pd.DataFrame([inscripcion(9, 13, 99, dia(5))])
        tasa, n_prev = tasas_previas(fila, h, "estudiante_id", self.BASE)
        self.assertEqual(n_prev[0], 0)
        self.assertEqual(tasa[0], self.BASE)


class PrepararInscripcionesTest(unittest.TestCase):
    def test_separa_pasadas_y_futuras_y_deja_afuera_las_en_curso(self):
        filas = [
            inscripcion(1, 10, 1, AHORA - timedelta(days=2), "ASISTIO"),
            inscripcion(2, 11, 1, AHORA - timedelta(minutes=30), "AGENDADA"),  # en curso
            inscripcion(3, 12, 1, AHORA + timedelta(days=2), "AGENDADA"),
        ]
        etiquetadas, futuras = preparar_inscripciones(pd.DataFrame(filas), AHORA)
        self.assertEqual(list(etiquetadas["tutoria_reserva_id"]), [1])
        self.assertEqual(list(futuras["tutoria_reserva_id"]), [3])

    def test_excluye_canceladas_espera_y_tutorias_canceladas_tambien_del_cupo(self):
        inicio = AHORA + timedelta(days=1)
        filas = [
            inscripcion(1, 10, 1, inicio),
            inscripcion(2, 10, 2, inicio, "CANCELADA"),
            inscripcion(3, 10, 3, inicio, "ESPERA"),
            inscripcion(4, 11, 4, inicio, tutoria_estado="CANCELADA"),
        ]
        _, futuras = preparar_inscripciones(pd.DataFrame(filas), AHORA)
        self.assertEqual(list(futuras["tutoria_reserva_id"]), [1])
        self.assertEqual(int(futuras["inscriptos"].iloc[0]), 1)

    def test_una_tutoria_sin_asistencia_registrada_no_es_etiqueta(self):
        inicio = AHORA - timedelta(days=3)
        filas = [
            # Nadie marcado: no se pasó lista.
            inscripcion(1, 10, 1, inicio),
            inscripcion(2, 10, 2, inicio),
            # Con al menos un presente: los AGENDADA no fueron.
            inscripcion(3, 11, 1, inicio, "ASISTIO"),
            inscripcion(4, 11, 2, inicio),
            # Cerrada sin presentes: se tomó asistencia y no fue nadie.
            inscripcion(5, 12, 3, inicio, tutoria_estado="CERRADA"),
        ]
        etiquetadas, _ = preparar_inscripciones(pd.DataFrame(filas), AHORA)
        self.assertEqual(sorted(etiquetadas["tutoria_reserva_id"]), [3, 4, 5])
        etiquetas = dict(zip(etiquetadas["tutoria_reserva_id"], etiquetadas["y"], strict=True))
        self.assertEqual(etiquetas, {3: 1, 4: 0, 5: 0})

    def test_una_inscripcion_cargada_despues_de_la_tutoria_no_es_etiqueta(self):
        inicio = AHORA - timedelta(days=3)
        filas = [
            inscripcion(1, 10, 1, inicio, "ASISTIO", antelacion_h=-48),
            inscripcion(2, 10, 2, inicio, "ASISTIO"),
        ]
        etiquetadas, _ = preparar_inscripciones(pd.DataFrame(filas), AHORA)
        self.assertEqual(list(etiquetadas["tutoria_reserva_id"]), [2])

    def test_confirmada_no_entra_en_las_features(self):
        self.assertNotIn("confirmada", CLAVES)
        self.assertNotIn("estado", CLAVES)
        filas = [inscripcion(i, 10 + i, i, dia(i), "ASISTIO", confirmada=True) for i in range(4)]
        df = pd.DataFrame(filas).assign(inscriptos=1, y=1)
        con = construir_features(df, df, 0.5)
        sin = construir_features(df.assign(confirmada=False, estado="AGENDADA"), df, 0.5)
        pd.testing.assert_frame_equal(con, sin)


class FeaturesTest(unittest.TestCase):
    def test_franja_fin_de_semana_antelacion_y_ocupacion(self):
        filas = [
            # Sábado 5/9 09:00 en Montevideo (12:00 UTC), anotado 10 h antes.
            inscripcion(1, 10, 1, datetime(2026, 9, 5, 12, tzinfo=UTC), antelacion_h=10, cupo=4),
            # Martes 8/9 19:00 en Montevideo (22:00 UTC), anotado después de empezar.
            inscripcion(2, 11, 1, datetime(2026, 9, 8, 22, tzinfo=UTC), antelacion_h=-2, temario="  "),
        ]
        df = pd.DataFrame(filas).assign(inscriptos=[2, 5])
        x = construir_features(df, df.iloc[0:0].assign(y=[]), 0.5)
        self.assertEqual(list(x["franja_manana"]), [1.0, 0.0])
        self.assertEqual(list(x["franja_noche"]), [0.0, 1.0])
        self.assertEqual(list(x["fin_de_semana"]), [1.0, 0.0])
        self.assertAlmostEqual(x["antelacion"].iloc[0], np.log1p(10))
        self.assertEqual(x["antelacion"].iloc[1], 0.0)
        self.assertEqual(list(x["ocupacion"]), [0.5, 0.5])
        self.assertEqual(list(x["tiene_temario"]), [1.0, 0.0])


class MetricasTest(unittest.TestCase):
    def test_con_senal_obvia_el_auc_es_alto_y_le_gana_a_la_base(self):
        rng = np.random.default_rng(1)
        y = rng.integers(0, 2, size=500)
        p = np.clip(0.15 + 0.7 * y + rng.normal(0, 0.05, size=500), 0.01, 0.99)
        m = metricas(y, p, float(y.mean()))
        self.assertGreater(m["auc"], 0.95)
        self.assertLess(m["brier"], m["brier_base"])
        self.assertGreater(m["exactitud"], 0.9)

    def test_con_predicciones_al_azar_el_auc_ronda_0_5(self):
        rng = np.random.default_rng(2)
        y = rng.integers(0, 2, size=4000)
        p = rng.uniform(0, 1, size=4000)
        m = metricas(y, p, float(y.mean()))
        self.assertAlmostEqual(m["auc"], 0.5, delta=0.04)
        self.assertGreater(m["brier"], m["brier_base"])

    def test_la_base_es_predecir_siempre_la_tasa_de_entrenamiento(self):
        y = np.array([1, 1, 0, 0])
        m = metricas(y, np.full(4, 0.5), 0.75)
        self.assertAlmostEqual(m["brier_base"], (2 * 0.25**2 + 2 * 0.75**2) / 4, places=4)

    def test_sin_las_dos_clases_el_auc_queda_null(self):
        self.assertIsNone(metricas(np.ones(10, dtype=int), np.full(10, 0.7), 0.6)["auc"])

    def test_la_calibracion_tiene_cinco_tramos_que_suman_n(self):
        rng = np.random.default_rng(4)
        p = np.concatenate([rng.uniform(0, 1, 300), [0.0, 0.2, 1.0]])
        y = rng.integers(0, 2, size=len(p))
        tramos = calibracion(y, p)
        self.assertEqual(len(tramos), 5)
        self.assertEqual(sum(t["n"] for t in tramos), len(p))
        self.assertEqual([t["desde"] for t in tramos], [0.0, 0.2, 0.4, 0.6, 0.8])
        self.assertEqual(tramos[-1]["hasta"], 1.0)

    def test_un_tramo_vacio_queda_con_null(self):
        tramos = calibracion(np.array([1, 0]), np.array([0.1, 0.15]))
        self.assertEqual(tramos[0]["n"], 2)
        self.assertIsNone(tramos[3]["predicho"])
        self.assertIsNone(tramos[3]["real"])


class DividirTemporalTest(unittest.TestCase):
    def test_lo_reciente_evalua_y_una_tutoria_no_queda_partida(self):
        filas = []
        rid = 0
        for t in range(20):
            for e in range(5):
                rid += 1
                filas.append(inscripcion(rid, t, e, dia(t), "ASISTIO"))
        df = pd.DataFrame(filas).assign(y=1)
        train, test, corte = dividir_temporal(df)
        self.assertLess(train["inicio"].max(), test["inicio"].min())
        self.assertEqual(set(train["tutoria_id"]) & set(test["tutoria_id"]), set())
        self.assertEqual(len(train) + len(test), len(df))
        self.assertEqual(len(test), 25)
        self.assertEqual(corte, test["inicio"].min())


def dataset_sintetico(n_tutorias: int = 60, n_estudiantes: int = 40, seed: int = 8) -> pd.DataFrame:
    """Asistencia que depende de una propensión por estudiante: la tasa previa tiene que captarla."""
    rng = np.random.default_rng(seed)
    propension = rng.normal(0, 1.5, size=n_estudiantes)
    filas = []
    rid = 0
    for t in range(n_tutorias):
        inicio = AHORA - timedelta(days=n_tutorias - t, hours=4)
        inscriptos = rng.choice(n_estudiantes, size=8, replace=False)
        for e in inscriptos:
            rid += 1
            asistio = rng.uniform() < 1 / (1 + np.exp(-propension[e]))
            filas.append(
                inscripcion(rid, t, int(e), inicio, "ASISTIO" if asistio else "AGENDADA", tutoria_estado="CERRADA",
                            materia=t % 5, cupo=12)
            )
    # Una tutoría futura con cuatro inscriptos.
    for e in range(4):
        rid += 1
        filas.append(inscripcion(rid, 999, e, AHORA + timedelta(days=3), cupo=6))
    return pd.DataFrame(filas)


class EntrenarAcademicoTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.datos = dataset_sintetico()
        cls.resultado = entrenar_y_predecir_asistencia(cls.datos, ahora=AHORA)

    def test_predice_cada_inscripcion_futura_con_probabilidad_en_0_1(self):
        preds = self.resultado.predicciones
        self.assertEqual(len(preds), 4)
        self.assertEqual({p["tutoria_id"] for p in preds}, {999})
        for p in preds:
            self.assertGreater(p["probabilidad"], 0)
            self.assertLess(p["probabilidad"], 1)

    def test_aprende_la_asistencia_previa(self):
        self.assertGreater(self.resultado.auc, 0.65)
        self.assertLess(self.resultado.brier, self.resultado.brier_base)
        principal = self.resultado.params["factores"][0]
        self.assertEqual(principal["clave"], "tasa_previa_estudiante")
        self.assertGreater(principal["odds_ratio"], 1)

    def test_params_con_las_claves_del_contrato(self):
        params = self.resultado.params
        for clave in ("muestras", "validacion", "tasa_base", "auc", "brier", "brier_base", "log_loss", "exactitud",
                      "calibracion", "factores", "historico_semanal"):
            self.assertIn(clave, params)
        self.assertEqual(set(params["validacion"]) >= {"desde", "hasta", "n"}, True)
        self.assertEqual(params["muestras"], 480)
        self.assertEqual(self.resultado.sample_size, 480)
        self.assertEqual(self.resultado.holdout_size, params["validacion"]["n"])

    def test_factores_todos_y_ordenados_por_peso(self):
        factores = self.resultado.params["factores"]
        self.assertEqual({f["clave"] for f in factores}, set(CLAVES))
        pesos = [abs(f["coef"]) for f in factores]
        self.assertEqual(pesos, sorted(pesos, reverse=True))
        for f in factores:
            self.assertAlmostEqual(f["odds_ratio"], float(np.exp(f["coef"])), delta=0.001)

    def test_historico_semanal_suma_la_validacion(self):
        semanal = self.resultado.params["historico_semanal"]
        self.assertEqual(sum(s["inscriptos"] for s in semanal), self.resultado.params["validacion"]["n"])
        for s in semanal:
            self.assertEqual(pd.Timestamp(s["semana"]).dayofweek, 0)
            self.assertLessEqual(s["asistieron"], s["inscriptos"])

    def test_la_calibracion_suma_la_validacion(self):
        tramos = self.resultado.params["calibracion"]
        self.assertEqual(sum(t["n"] for t in tramos), self.resultado.params["validacion"]["n"])

    def test_con_menos_de_100_etiquetadas_no_entrena(self):
        chico = self.datos[self.datos["tutoria_id"] < 10]
        with self.assertRaises(ValueError):
            entrenar_y_predecir_asistencia(chico, ahora=AHORA)


if __name__ == "__main__":
    unittest.main()
