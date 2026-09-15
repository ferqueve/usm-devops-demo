"""Tests de la orquestación de entrenamientos (sin base: se reemplaza la persistencia).

    python -m pytest test_main.py
"""

from __future__ import annotations

import unittest
from contextlib import contextmanager
from datetime import date
from unittest import mock

import pandas as pd

import main


class TrainTodoTest(unittest.TestCase):
    def test_un_fallo_no_frena_a_los_demas_y_responde_igual(self):
        def sin_datos():
            raise ValueError("Histórico de pedidos insuficiente")

        def roto():
            raise RuntimeError("se cayó la conexión")

        with (
            mock.patch.object(main, "entrenar_reservas", return_value={"status": "ok", "modelo_id": 1}),
            mock.patch.object(main, "entrenar_inventario", side_effect=sin_datos),
            mock.patch.object(main, "entrenar_academico", side_effect=roto),
        ):
            respuesta = main.train_todo()

        self.assertEqual(respuesta["reservas"], {"status": "ok", "modelo_id": 1})
        self.assertEqual(respuesta["inventario"]["status"], "error")
        self.assertIn("insuficiente", respuesta["inventario"]["detalle"])
        self.assertEqual(respuesta["academico"]["status"], "error")
        self.assertIn("se cayó la conexión", respuesta["academico"]["detalle"])


class TipoEspacioTest(unittest.TestCase):
    def setUp(self):
        self.desactivados = []

        @contextmanager
        def transaccion_falsa():
            yield object()

        def desactivar(conn, scope, espacio_id=None, tipo_espacio_id=None):
            self.desactivados.append((scope, espacio_id, tipo_espacio_id))

        self.parches = [
            mock.patch.object(main, "transaccion", transaccion_falsa),
            mock.patch.object(main, "desactivar_modelos_previos", side_effect=desactivar),
        ]
        for p in self.parches:
            p.start()

    def tearDown(self):
        for p in self.parches:
            p.stop()

    def test_un_tipo_con_poca_historia_se_omite_y_apaga_su_modelo_anterior(self):
        historico = pd.DataFrame(
            {
                "tipo_espacio_id": 2,
                "ds": pd.date_range("2026-08-01", periods=10, freq="D"),
                "y": 3,
            }
        )
        estado = main._entrenar_tipo_espacio(
            {"id": 2, "nombre": "Anfiteatro"}, historico, pd.Timestamp("2026-08-10"), date(2026, 8, 11)
        )

        self.assertEqual(estado["status"], "omitido")
        self.assertIn("días con reservas", estado["detalle"])
        # Sólo el de su tipo: los otros tipos y el global no se tocan.
        self.assertEqual(self.desactivados, [("tipo_espacio", None, 2)])

    def test_un_error_en_un_tipo_se_informa_sin_lanzar(self):
        historico = pd.DataFrame({"tipo_espacio_id": [1], "ds": [pd.Timestamp("2026-08-01")], "y": [5]})
        with mock.patch.object(main, "motivo_omision_tipo", side_effect=RuntimeError("explotó")):
            estado = main._entrenar_tipo_espacio(
                {"id": 1, "nombre": "Aula"}, historico, pd.Timestamp("2026-08-01"), date(2026, 8, 2)
            )

        self.assertEqual(estado["status"], "error")
        self.assertIn("explotó", estado["detalle"])
        self.assertEqual(self.desactivados, [])


class JsonLimpioTest(unittest.TestCase):
    def test_params_sin_nan_y_con_tipos_de_numpy(self):
        import json

        import numpy as np

        from db import _json_limpio

        limpio = _json_limpio({"wape": float("nan"), "n": np.int64(3), "tipos": {5: [np.float64(1.5), float("inf")]}})

        self.assertEqual(limpio, {"wape": None, "n": 3, "tipos": {"5": [1.5, None]}})
        json.dumps(limpio, allow_nan=False)


if __name__ == "__main__":
    unittest.main()
