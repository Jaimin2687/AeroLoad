package com.aeroload.model;

import jakarta.persistence.*;

@Entity
public class AggregatedMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "test_run_id")
    private TestRun testRun;

    private double averageLatencyMs;
    private double p95LatencyMs;
    private double errorRatePercentage;

    // Extended fields for production diagnosis report
    private int totalRequests;
    private int totalErrors;
    private String testStatus;       // "PASSED" | "FAILED"
    private String firstFailureType; // e.g. "HTTP 503 Timeout", "HTTP 500 Internal Error"

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TestRun getTestRun() { return testRun; }
    public void setTestRun(TestRun testRun) { this.testRun = testRun; }

    public double getAverageLatencyMs() { return averageLatencyMs; }
    public void setAverageLatencyMs(double averageLatencyMs) { this.averageLatencyMs = averageLatencyMs; }

    public double getP95LatencyMs() { return p95LatencyMs; }
    public void setP95LatencyMs(double p95LatencyMs) { this.p95LatencyMs = p95LatencyMs; }

    public double getErrorRatePercentage() { return errorRatePercentage; }
    public void setErrorRatePercentage(double errorRatePercentage) { this.errorRatePercentage = errorRatePercentage; }

    public int getTotalRequests() { return totalRequests; }
    public void setTotalRequests(int totalRequests) { this.totalRequests = totalRequests; }

    public int getTotalErrors() { return totalErrors; }
    public void setTotalErrors(int totalErrors) { this.totalErrors = totalErrors; }

    public String getTestStatus() { return testStatus; }
    public void setTestStatus(String testStatus) { this.testStatus = testStatus; }

    public String getFirstFailureType() { return firstFailureType; }
    public void setFirstFailureType(String firstFailureType) { this.firstFailureType = firstFailureType; }
}