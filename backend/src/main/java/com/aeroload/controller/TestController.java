package com.aeroload.controller;

import com.aeroload.model.TestRun;
import com.aeroload.model.AggregatedMetrics;
import com.aeroload.service.TestService;
import com.aeroload.service.LogStreamService;
import com.aeroload.service.AttackStateService;
import com.aeroload.repository.AggregatedMetricsRepository;
import com.aeroload.repository.TestRunRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

    private final TestService testService;
    private final AggregatedMetricsRepository metricsRepository;
    private final LogStreamService logStreamService;
    private final AttackStateService attackStateService;
    private final TestRunRepository testRunRepository;

    public TestController(TestService testService,
                          AggregatedMetricsRepository metricsRepository,
                          LogStreamService logStreamService,
                          AttackStateService attackStateService,
                          TestRunRepository testRunRepository) {
        this.testService = testService;
        this.metricsRepository = metricsRepository;
        this.logStreamService = logStreamService;
        this.attackStateService = attackStateService;
        this.testRunRepository = testRunRepository;
    }

    /** Start a new attack. Returns the persisted TestRun immediately (non-blocking). */
    @PostMapping("/start")
    public ResponseEntity<TestRun> startTest(@RequestBody TestRun config) {
        logStreamService.sendLog("[INFO] Received HTTP POST /start — Target: " + config.getTargetUrl()
                + "  Users: " + config.getConcurrentUsers()
                + "  Duration: " + config.getDurationSeconds() + "s");
        return ResponseEntity.ok(testService.startTest(config));
    }

    /** Gracefully signal all worker threads to stop. */
    @PostMapping("/stop")
    public ResponseEntity<Map<String, String>> stopTest() {
        testService.stopTest();
        return ResponseEntity.ok(Map.of("message", "Abort signal sent to all worker threads."));
    }

    /** Returns the latest TestRun status (Running / Completed). */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        TestRun run = testService.getLatestTest();
        if (run == null) {
            return ResponseEntity.ok(Map.of(
                    "status", "Idle",
                    "isRunning", false
            ));
        }
        return ResponseEntity.ok(Map.of(
                "status", run.getStatus(),
                "isRunning", attackStateService.isRunning(),
                "targetUrl", run.getTargetUrl() != null ? run.getTargetUrl() : "",
                "concurrentUsers", run.getConcurrentUsers(),
                "durationSeconds", run.getDurationSeconds(),
                "id", run.getId()
        ));
    }

    /** Returns the full history of test runs ordered by newest first. */
    @GetMapping("/history")
    public ResponseEntity<List<TestRun>> getHistory() {
        return ResponseEntity.ok(testService.getAllTests());
    }

    /** Returns aggregated metrics for a specific TestRun ID. */
    @GetMapping("/metrics/{testRunId}")
    public ResponseEntity<AggregatedMetrics> getMetrics(@PathVariable Long testRunId) {
        AggregatedMetrics metrics = metricsRepository.findByTestRunId(testRunId);
        if (metrics == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(metrics);
    }

    /** Returns the diagnosis report for the most recent completed test run. */
    @GetMapping("/report/latest")
    public ResponseEntity<AggregatedMetrics> getLatestReport() {
        List<TestRun> runs = testRunRepository.findAllByOrderByIdDesc();
        for (TestRun run : runs) {
            AggregatedMetrics metrics = metricsRepository.findByTestRunId(run.getId());
            if (metrics != null) {
                return ResponseEntity.ok(metrics);
            }
        }
        return ResponseEntity.notFound().build();
    }

    /** SSE stream endpoint — connects a browser client to the live log stream. */
    @GetMapping("/stream")
    public SseEmitter stream() {
        return logStreamService.createEmitter();
    }
}