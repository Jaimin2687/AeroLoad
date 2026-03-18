package com.aeroload.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class LogStreamService {

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();

    /**
     * Creates a new SSE emitter with an infinite timeout so it never disconnects
     * due to idle time. A heartbeat event is sent immediately on creation to ensure
     * the browser onopen() callback fires reliably.
     */
    public SseEmitter createEmitter() {
        // Long.MAX_VALUE = no timeout at the Spring level; proxies/nginx may still
        // impose their own, which is handled by our 15-second heartbeat.
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
        });
        emitter.onError((e) -> emitters.remove(emitter));

        // Send an initial heartbeat so the browser fires onopen immediately
        try {
            emitter.send(SseEmitter.event()
                    .name("heartbeat")
                    .data("[SYSTEM] AeroLoad Live Terminal Engine v2.0 — Stream Active"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    /**
     * Sends a log line to all connected SSE clients as the default "message" event.
     */
    public void sendLog(String message) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("message").data(message));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    /**
     * Sends a structured diagnosis JSON payload as a named "diagnosis" SSE event.
     * The frontend listens for this specific event name to trigger the report modal.
     */
    public void sendDiagnosis(String jsonPayload) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("diagnosis").data(jsonPayload));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    /**
     * Schedules a periodic heartbeat every 15 seconds to keep every SSE connection
     * alive through any proxy or firewall that might time out idle HTTP connections.
     */
    @PostConstruct
    public void startHeartbeat() {
        heartbeatScheduler.scheduleAtFixedRate(() -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (IOException e) {
                    emitters.remove(emitter);
                }
            }
        }, 15, 15, TimeUnit.SECONDS);
    }
}