package com.aeroload.engine;

import com.aeroload.model.AggregatedMetrics;
import com.aeroload.model.TestRun;
import com.aeroload.service.AttackStateService;
import com.aeroload.service.LogStreamService;
import com.aeroload.service.MetricsAggregatorService;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component("rampUpStrategy")
public class RampUpTestStrategy implements LoadStrategy {

    private final MetricsFileHandler fileHandler;
    private final LogStreamService logStreamService;
    private final AttackStateService attackStateService;
    private final MetricsAggregatorService metricsAggregatorService;

    public RampUpTestStrategy(MetricsFileHandler fileHandler,
                              LogStreamService logStreamService,
                              AttackStateService attackStateService,
                              MetricsAggregatorService metricsAggregatorService) {
        this.fileHandler = fileHandler;
        this.logStreamService = logStreamService;
        this.attackStateService = attackStateService;
        this.metricsAggregatorService = metricsAggregatorService;
    }

    @Override
    public void executeTest(TestRun config) {
        attackStateService.markStarted();

        logStreamService.sendLog("[INFO] Generating RampUpTestStrategy Configuration...");
        logStreamService.sendLog("[INFO] Strategy: Ramp-Up — gradually scaling to " + config.getConcurrentUsers() + " users over " + config.getDurationSeconds() + "s.");
        logStreamService.sendLog("[INFO] Target: " + config.getTargetUrl());

        ExecutorService executor = Executors.newFixedThreadPool(Math.min(config.getConcurrentUsers(), 500));
        long endTime = System.currentTimeMillis() + (config.getDurationSeconds() * 1000L);
        long delayBetweenUsers = (config.getDurationSeconds() * 1000L) / Math.max(config.getConcurrentUsers(), 1);

        AtomicInteger consecutiveFailures = new AtomicInteger(0);

        for (int i = 0; i < config.getConcurrentUsers(); i++) {
            if (attackStateService.getAbortSignal().get()) break;

            executor.submit(new RequestTask(
                    config.getTargetUrl(), endTime, fileHandler, logStreamService,
                    attackStateService.getAbortSignal(), consecutiveFailures
            ));

            try {
                Thread.sleep(Math.min(delayBetweenUsers, 500));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        // Graceful shutdown — let all worker threads complete their current
        // request cycle so no in-flight metric rows are lost.
        executor.shutdown();
        try {
            executor.awaitTermination(config.getDurationSeconds() + 10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            logStreamService.sendLog("[FATAL] Ramp-Up Executor Interrupted.");
            Thread.currentThread().interrupt();
        }

        // Wait for the async MetricsFileHandler writer thread to drain its
        // BlockingQueue to disk BEFORE we read metrics.csv for aggregation.
        logStreamService.sendLog("[INFO] Flushing metrics queue to disk...");
        fileHandler.awaitDrain(10);

        // Aggregate metrics and emit structured diagnosis over SSE
        AggregatedMetrics report = metricsAggregatorService.aggregateAndSave(config);
        attackStateService.markFinished();

        emitDiagnosisEvent(report, config, attackStateService.getAbortSignal().get());
    }

    private void emitDiagnosisEvent(AggregatedMetrics report, TestRun config, boolean wasAutoKilled) {
        logStreamService.sendLog("=======================================================");
        logStreamService.sendLog("[DIAGNOSIS REPORT] " + report.getTestStatus());
        logStreamService.sendLog("=======================================================");
        logStreamService.sendLog("• TARGET: " + config.getTargetUrl());
        logStreamService.sendLog("• STRATEGY: Ramp-Up Test (" + config.getConcurrentUsers() + " users, " + config.getDurationSeconds() + "s)");
        logStreamService.sendLog("• TOTAL REQUESTS: " + report.getTotalRequests());
        logStreamService.sendLog("• TOTAL ERRORS: " + report.getTotalErrors());
        logStreamService.sendLog("• ERROR RATE: " + report.getErrorRatePercentage() + "%");
        logStreamService.sendLog("• AVG LATENCY: " + report.getAverageLatencyMs() + "ms");
        logStreamService.sendLog("• P95 LATENCY: " + report.getP95LatencyMs() + "ms");
        if (!"None".equals(report.getFirstFailureType())) {
            logStreamService.sendLog("• FIRST FAILURE: " + report.getFirstFailureType());
        }
        if (wasAutoKilled) {
            logStreamService.sendLog("• AUTO-KILL: Yes — consecutive failure threshold triggered.");
            logStreamService.sendLog("• FIX: The service collapsed before all users could ramp up. Check event loop saturation or DB pool exhaustion.");
        }
        logStreamService.sendLog("=======================================================");

        String json = buildDiagnosisJson(report, config, wasAutoKilled);
        logStreamService.sendDiagnosis(json);
    }

    private String buildDiagnosisJson(AggregatedMetrics r, TestRun config, boolean wasAutoKilled) {
        return "{"
                + "\"status\":\"" + r.getTestStatus() + "\","
                + "\"targetUrl\":\"" + config.getTargetUrl() + "\","
                + "\"strategy\":\"Ramp-Up Test\","
                + "\"concurrentUsers\":" + config.getConcurrentUsers() + ","
                + "\"durationSeconds\":" + config.getDurationSeconds() + ","
                + "\"totalRequests\":" + r.getTotalRequests() + ","
                + "\"totalErrors\":" + r.getTotalErrors() + ","
                + "\"errorRatePercentage\":" + r.getErrorRatePercentage() + ","
                + "\"averageLatencyMs\":" + r.getAverageLatencyMs() + ","
                + "\"p95LatencyMs\":" + r.getP95LatencyMs() + ","
                + "\"firstFailureType\":\"" + r.getFirstFailureType() + "\","
                + "\"autoKilled\":" + wasAutoKilled
                + "}";
    }
}