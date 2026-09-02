package com.utec.backend.controller;

import com.utec.backend.config.InMemoryErrorLogAppender;
import com.utec.backend.config.InMemoryErrorLogAppender.ErrorEvent;
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.distribution.HistogramSnapshot;
import io.micrometer.core.instrument.distribution.ValueAtPercentile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Endpoints de observabilidad propios:
 * - /errors → errores recientes capturados in-memory por InMemoryErrorLogAppender
 * - /slow-endpoints → top endpoints por p95/p99 desde Micrometer
 */
@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Slf4j
public class SystemController {

    private final InMemoryErrorLogAppender errorAppender;
    private final MeterRegistry meterRegistry;

    @GetMapping("/errors")
    @PreAuthorize("hasPermission(null, 'sistema:acceder')")
    public Map<String, Object> getRecentErrors(
            @RequestParam(defaultValue = "10") int top,
            @RequestParam(defaultValue = "24") int hoursBack) {
        Instant cutoff = Instant.now().minus(hoursBack, ChronoUnit.HOURS);
        List<ErrorEvent> all = errorAppender.snapshot();

        Map<String, AggregatedError> aggregated = new HashMap<>();
        for (ErrorEvent ev : all) {
            Instant ts = Instant.parse(ev.getTimestamp());
            if (ts.isBefore(cutoff)) continue;
            String key = ev.getLevel() + "|" + ev.getMessage();
            AggregatedError agg = aggregated.computeIfAbsent(key, k -> new AggregatedError(
                    ev.getLevel(), ev.getMessage(), ev.getLogger(), ev.getException()));
            agg.incrementCount();
            if (agg.getLastTimestamp() == null || ts.isAfter(Instant.parse(agg.getLastTimestamp()))) {
                agg.setLastTimestamp(ev.getTimestamp());
            }
        }

        List<AggregatedError> topErrors = aggregated.values().stream()
                .sorted(Comparator.comparingInt(AggregatedError::getCount).reversed())
                .limit(top)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCaptured", all.size());
        result.put("totalGroupsInWindow", aggregated.size());
        result.put("windowHours", hoursBack);
        result.put("top", topErrors);
        return result;
    }

    @GetMapping("/slow-endpoints")
    @PreAuthorize("hasPermission(null, 'sistema:acceder')")
    public Map<String, Object> getSlowEndpoints(@RequestParam(defaultValue = "10") int top) {
        List<SlowEndpoint> endpoints = meterRegistry.getMeters().stream()
                .filter(m -> "http.server.requests".equals(m.getId().getName()))
                .filter(Timer.class::isInstance)
                .map(m -> (Timer) m)
                .filter(t -> t.count() > 0)
                .map(this::toSlowEndpoint)
                .sorted(Comparator.comparingDouble(SlowEndpoint::p95).reversed())
                .limit(top)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("unit", "ms");
        result.put("top", endpoints);
        return result;
    }

    private SlowEndpoint toSlowEndpoint(Timer t) {
        Meter.Id id = t.getId();
        String uri = id.getTag("uri");
        String method = id.getTag("method");
        String status = id.getTag("status");

        HistogramSnapshot snapshot = t.takeSnapshot();
        double p95 = 0;
        double p99 = 0;
        for (ValueAtPercentile vap : snapshot.percentileValues()) {
            double pct = vap.percentile();
            double valueMs = vap.value(TimeUnit.MILLISECONDS);
            if (Math.abs(pct - 0.95) < 0.001) p95 = valueMs;
            else if (Math.abs(pct - 0.99) < 0.001) p99 = valueMs;
        }

        return new SlowEndpoint(
                uri != null ? uri : "(unknown)",
                method != null ? method : "",
                status != null ? status : "",
                t.count(),
                t.mean(TimeUnit.MILLISECONDS),
                t.max(TimeUnit.MILLISECONDS),
                p95,
                p99);
    }

    /**
     * Grupo de errores idénticos. Los getters definen el JSON que consume el
     * frontend, así que sus nombres no pueden cambiar.
     */
    public static class AggregatedError {
        private final String level;
        private final String message;
        private final String logger;
        private final String exception;
        private int count = 0;
        private String lastTimestamp;

        public AggregatedError(String level, String message, String logger, String exception) {
            this.level = level;
            this.message = message;
            this.logger = logger;
            this.exception = exception;
        }

        public String getLevel() { return level; }
        public String getMessage() { return message; }
        public String getLogger() { return logger; }
        public String getException() { return exception; }
        public int getCount() { return count; }
        public String getLastTimestamp() { return lastTimestamp; }

        public void incrementCount() { count++; }
        public void setLastTimestamp(String lastTimestamp) { this.lastTimestamp = lastTimestamp; }
    }

    /**
     * Un endpoint con sus latencias. Los nombres de los componentes son los del
     * JSON que consume el frontend.
     */
    public record SlowEndpoint(
            String uri,
            String method,
            String status,
            long count,
            double meanMs,
            double maxMs,
            double p95,
            double p99) {
    }
}
