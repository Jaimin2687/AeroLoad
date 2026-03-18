package com.aeroload.service;

import com.aeroload.engine.MetricsFileHandler;
import com.aeroload.model.AggregatedMetrics;
import com.aeroload.model.TestRun;
import com.aeroload.repository.AggregatedMetricsRepository;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class MetricsAggregatorService {

    private final AggregatedMetricsRepository aggregatedMetricsRepository;
    private final MetricsFileHandler fileHandler;

    // Latency threshold (ms) above which we flag a request as "slow"
    private static final double HIGH_LATENCY_THRESHOLD_MS = 1000.0;
    // Error rate above which the test is considered FAILED
    private static final double MAX_ALLOWED_ERROR_RATE = 5.0;

    public MetricsAggregatorService(AggregatedMetricsRepository aggregatedMetricsRepository,
                                    MetricsFileHandler fileHandler) {
        this.aggregatedMetricsRepository = aggregatedMetricsRepository;
        this.fileHandler = fileHandler;
    }

    public AggregatedMetrics aggregateAndSave(TestRun testRun) {
        long totalLatency = 0;
        int totalRequests = 0;
        int errorRequests = 0;
        List<Long> latencies = new ArrayList<>();
        String firstFailureType = null;

        try (BufferedReader reader = new BufferedReader(new FileReader("metrics.csv"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    int statusCode;
                    long latency;
                    try {
                        statusCode = Integer.parseInt(parts[1].trim());
                        latency = Long.parseLong(parts[2].trim());
                    } catch (NumberFormatException e) {
                        continue; // skip malformed rows
                    }

                    latencies.add(latency);
                    totalLatency += latency;
                    totalRequests++;

                    if (statusCode >= 400) {
                        errorRequests++;
                        // Record the first failure type encountered
                        if (firstFailureType == null) {
                            if (statusCode == 503) {
                                firstFailureType = "HTTP 503 — Connection Timeout / Service Unavailable";
                            } else if (statusCode == 500) {
                                firstFailureType = "HTTP 500 — Internal Server Error";
                            } else if (statusCode == 429) {
                                firstFailureType = "HTTP 429 — Rate Limit Exceeded";
                            } else if (statusCode == 401 || statusCode == 403) {
                                firstFailureType = "HTTP " + statusCode + " — Authentication / Authorization Failure";
                            } else {
                                firstFailureType = "HTTP " + statusCode + " — Client/Server Error";
                            }
                        }
                    }
                }
            }
        } catch (IOException e) {
            // metrics.csv may not exist on the very first run; that's fine
            System.err.println("[MetricsAggregator] Could not read metrics.csv: " + e.getMessage());
        }

        double averageLatency = totalRequests > 0 ? (double) totalLatency / totalRequests : 0;
        double errorRate = totalRequests > 0 ? ((double) errorRequests / totalRequests) * 100 : 0;
        double p95Latency = calculateP95(latencies);

        // Determine overall test status
        String testStatus = "PASSED";
        if (errorRate > MAX_ALLOWED_ERROR_RATE) {
            testStatus = "FAILED";
        } else if (p95Latency > HIGH_LATENCY_THRESHOLD_MS && totalRequests > 0) {
            testStatus = "DEGRADED"; // passes threshold but slow
            if (firstFailureType == null) {
                firstFailureType = "High P95 Latency (" + (long) p95Latency + "ms > threshold " + (long) HIGH_LATENCY_THRESHOLD_MS + "ms)";
            }
        }

        AggregatedMetrics metrics = new AggregatedMetrics();
        metrics.setTestRun(testRun);
        metrics.setAverageLatencyMs(Math.round(averageLatency * 10.0) / 10.0);
        metrics.setP95LatencyMs(Math.round(p95Latency * 10.0) / 10.0);
        metrics.setErrorRatePercentage(Math.round(errorRate * 10.0) / 10.0);
        metrics.setTotalRequests(totalRequests);
        metrics.setTotalErrors(errorRequests);
        metrics.setTestStatus(testStatus);
        metrics.setFirstFailureType(firstFailureType != null ? firstFailureType : "None");

        aggregatedMetricsRepository.save(metrics);

        // Clear the raw CSV file for the next test run
        fileHandler.clearFile();

        return metrics;
    }

    private double calculateP95(List<Long> latencies) {
        if (latencies.isEmpty()) return 0.0;
        Collections.sort(latencies);
        int index = (int) Math.ceil(95.0 / 100.0 * latencies.size()) - 1;
        return latencies.get(Math.max(0, index));
    }
}