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
            agg.count++;
            if (agg.lastTimestamp == null || ts.isAfter(Instant.parse(agg.lastTimestamp))) {
                agg.lastTimestamp = ev.getTimestamp();
            }
        }

        List<AggregatedError> topErrors = aggregated.values().stream()
                .sorted(Comparator.comparingInt((AggregatedError e) -> e.count).reversed())
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
                .filter(m -> m instanceof Timer)
                .map(m -> (Timer) m)
                .filter(t -> t.count() > 0)
                .map(this::toSlowEndpoint)
                .sorted(Comparator.comparingDouble((SlowEndpoint s) -> s.p95).reversed())
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
        double p95 = 0, p99 = 0;
        for (ValueAtPercentile vap : snapshot.percentileValues()) {
            double pct = vap.percentile();
            double valueMs = vap.value(TimeUnit.MILLISECONDS);
            if (Math.abs(pct - 0.95) < 0.001) p95 = valueMs;
            else if (Math.abs(pct - 0.99) < 0.001) p99 = valueMs;
        }

        SlowEndpoint s = new SlowEndpoint();
        s.uri = uri != null ? uri : "(unknown)";
        s.method = method != null ? method : "";
        s.status = status != null ? status : "";
        s.count = t.count();
        s.meanMs = t.mean(TimeUnit.MILLISECONDS);
        s.maxMs = t.max(TimeUnit.MILLISECONDS);
        s.p95 = p95;
        s.p99 = p99;
        return s;
    }

    public static class AggregatedError {
        public final String level;
        public final String message;
        public final String logger;
        public final String exception;
        public int count = 0;
        public String lastTimestamp;

        public AggregatedError(String level, String message, String logger, String exception) {
            this.level = level;
            this.message = message;
            this.logger = logger;
            this.exception = exception;
        }
    }

    public static class SlowEndpoint {
        public String uri;
        public String method;
        public String status;
        public long count;
        public double meanMs;
        public double maxMs;
        public double p95;
        public double p99;
    }
}
