package com.aeroload.engine;

import com.aeroload.service.LogStreamService;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.SocketTimeoutException;
import java.net.ConnectException;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class RequestTask implements Runnable {
    private final String targetUrl;
    private final long endTimeMs;
    private final MetricsFileHandler fileHandler;
    private final LogStreamService logStreamService;
    private final AtomicBoolean abortSignal;
    private final AtomicInteger consecutiveFailures;
    
    private static final int MAX_CONSECUTIVE_FAILURES = 15;
    private static final int MAX_LATENCY_MS = 2500;

    public RequestTask(String targetUrl, long endTimeMs, MetricsFileHandler fileHandler, LogStreamService logStreamService) {
        this.targetUrl = targetUrl;
        this.endTimeMs = endTimeMs;
        this.fileHandler = fileHandler;
        this.logStreamService = logStreamService;
        this.abortSignal = new AtomicBoolean(false);
        this.consecutiveFailures = new AtomicInteger(0);
    }

    public RequestTask(String targetUrl, long endTimeMs, MetricsFileHandler fileHandler, LogStreamService logStreamService, AtomicBoolean abortSignal, AtomicInteger consecutiveFailures) {
        this.targetUrl = targetUrl;
        this.endTimeMs = endTimeMs;
        this.fileHandler = fileHandler;
        this.logStreamService = logStreamService;
        this.abortSignal = abortSignal;
        this.consecutiveFailures = consecutiveFailures;
    }

    @Override
    public void run() {
        int requestCount = 0;
        while (System.currentTimeMillis() < endTimeMs && !abortSignal.get()) {
            long start = System.currentTimeMillis();
            int statusCode = 0;
            try {
                // Fixed deprecation using URI
                HttpURLConnection conn = (HttpURLConnection) URI.create(targetUrl).toURL().openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(MAX_LATENCY_MS);
                conn.setReadTimeout(MAX_LATENCY_MS);
                statusCode = conn.getResponseCode();
            } catch (SocketTimeoutException | ConnectException e) {
                statusCode = 503; 
                if (Math.random() < 0.05) { // Log 5% of errors to prevent buffer flood
                    logStreamService.sendLog("[ERROR 503] Connection Dropped / Timeout on worker thread.");
                }
            } catch (IOException e) {
                statusCode = 500; 
                if (Math.random() < 0.05) {
                    logStreamService.sendLog("[ERROR 500] Internal Server Error on worker thread.");
                }
            } finally {
                long latency = System.currentTimeMillis() - start;
                fileHandler.queueMetric(System.currentTimeMillis() + "," + statusCode + "," + latency);
                
                // --- HEALTH DIAGNOSIS CHECK ---
                if (statusCode >= 500 || latency >= MAX_LATENCY_MS) {
                    int fails = consecutiveFailures.incrementAndGet();
                    if (fails >= MAX_CONSECUTIVE_FAILURES && !abortSignal.get()) {
                        abortSignal.set(true);
                        logStreamService.sendLog("[FATAL] Auto-Kill Engaged! Consecutive failures reached maximum threshold.");
                    }
                } else if (statusCode >= 200 && statusCode < 400) {
                    // Recovered, clear consecutive failures
                    consecutiveFailures.set(0);
                }

                requestCount++;
                if (requestCount % 50 == 0 && !abortSignal.get()) { // Sample logs to terminal
                    logStreamService.sendLog("[" + statusCode + " OK] Latency: " + latency + "ms");
                }
            }
        }
    }
}