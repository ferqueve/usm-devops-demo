package com.utec.backend.config;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

/**
 * Captura los últimos errores (WARN/ERROR) en memoria via un appender Logback,
 * para exponerlos por /api/v1/system/errors sin tener que parsear el log file.
 */
@Component
public class InMemoryErrorLogAppender extends AppenderBase<ILoggingEvent> {

    private static final int MAX_EVENTS = 500;
    private final Deque<ErrorEvent> events = new ArrayDeque<>(MAX_EVENTS);

    @PostConstruct
    void register() {
        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        setContext(lc);
        setName("inMemoryErrorAppender");
        start();
        Logger root = lc.getLogger(Logger.ROOT_LOGGER_NAME);
        root.addAppender(this);
    }

    @Override
    protected synchronized void append(ILoggingEvent event) {
        if (event.getLevel().toInt() < Level.WARN_INT) {
            return;
        }
        if (events.size() >= MAX_EVENTS) {
            events.pollFirst();
        }
        IThrowableProxy throwable = event.getThrowableProxy();
        events.addLast(new ErrorEvent(
                Instant.ofEpochMilli(event.getTimeStamp()).toString(),
                event.getLevel().toString(),
                event.getLoggerName(),
                event.getFormattedMessage(),
                throwable != null ? throwable.getClassName() : null
        ));
    }

    public synchronized List<ErrorEvent> snapshot() {
        return List.copyOf(events);
    }

    @Data
    public static class ErrorEvent {
        private final String timestamp;
        private final String level;
        private final String logger;
        private final String message;
        private final String exception;
    }
}
