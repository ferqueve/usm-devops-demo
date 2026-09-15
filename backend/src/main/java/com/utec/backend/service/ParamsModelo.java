package com.utec.backend.service;

import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.utec.backend.model.ModeloForecast;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Lectura tolerante del params_json que escribe ml-svc.
 *
 * Es un contrato entre dos servicios que se despliegan por separado: un
 * modelo entrenado con una versión vieja no tiene las claves nuevas, y una
 * clave que falta o viene con otro tipo tiene que salir null en la pantalla,
 * no tirar abajo el endpoint.
 */
@Slf4j
final class ParamsModelo {

    // pandas/numpy serializan NaN tal cual y Jackson lo rechaza por defecto:
    // se acepta al leer y después se trata como dato faltante.
    private static final ObjectMapper MAPPER = JsonMapper.builder()
            .enable(JsonReadFeature.ALLOW_NON_NUMERIC_NUMBERS)
            .build();

    static final ParamsModelo VACIO = new ParamsModelo(Map.of());

    private final Map<String, Object> valores;

    private ParamsModelo(Map<String, Object> valores) {
        this.valores = valores;
    }

    static ParamsModelo de(ModeloForecast modelo) {
        String json = modelo.getParamsJson();
        if (json == null || json.isBlank()) {
            return VACIO;
        }
        try {
            Map<String, Object> leido = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
            return leido == null ? VACIO : new ParamsModelo(leido);
        } catch (Exception e) {
            log.warn("params_json ilegible en el modelo {}: {}", modelo.getId(), e.getMessage());
            return VACIO;
        }
    }

    @SuppressWarnings("unchecked")
    private static ParamsModelo deObjeto(Object valor) {
        return valor instanceof Map<?, ?> mapa ? new ParamsModelo((Map<String, Object>) mapa) : VACIO;
    }

    Set<String> claves() {
        return valores.keySet();
    }

    boolean vacio() {
        return valores.isEmpty();
    }

    /** El valor tal cual vino (listas y mapas incluidos), de la primera clave presente. */
    Object crudo(String... claves) {
        for (String clave : claves) {
            Object valor = valores.get(clave);
            if (valor != null) {
                return valor;
            }
        }
        return null;
    }

    Double decimal(String... claves) {
        for (String clave : claves) {
            if (valores.get(clave) instanceof Number numero && Double.isFinite(numero.doubleValue())) {
                return numero.doubleValue();
            }
        }
        return null;
    }

    Integer entero(String... claves) {
        Double valor = decimal(claves);
        return valor == null ? null : (int) Math.round(valor);
    }

    String texto(String... claves) {
        Object valor = crudo(claves);
        return valor == null ? null : valor.toString();
    }

    Boolean booleano(String... claves) {
        for (String clave : claves) {
            if (valores.get(clave) instanceof Boolean b) {
                return b;
            }
        }
        return null;
    }

    ParamsModelo objeto(String clave) {
        return deObjeto(valores.get(clave));
    }

    /** Lista de objetos; lo que no sea objeto se descarta. */
    List<ParamsModelo> objetos(String clave) {
        List<ParamsModelo> resultado = new ArrayList<>();
        if (valores.get(clave) instanceof List<?> lista) {
            for (Object elemento : lista) {
                if (elemento instanceof Map<?, ?>) {
                    resultado.add(deObjeto(elemento));
                }
            }
        }
        return resultado;
    }

    /** Lista de números; un elemento no numérico queda null para no correr las posiciones. */
    List<Double> decimales(String clave) {
        List<Double> resultado = new ArrayList<>();
        if (valores.get(clave) instanceof List<?> lista) {
            for (Object elemento : lista) {
                resultado.add(elemento instanceof Number numero && Double.isFinite(numero.doubleValue())
                        ? numero.doubleValue() : null);
            }
        }
        return resultado;
    }
}
