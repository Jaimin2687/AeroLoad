package com.aeroload.service;

import com.aeroload.engine.LoadStrategy;
import com.aeroload.model.TestRun;
import com.aeroload.repository.TestRunRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Service
public class TestService {

    private final TestRunRepository testRunRepository;
    private final Map<String, LoadStrategy> strategies;
    private final AttackStateService attackStateService;
    private final LogStreamService logStreamService;

    public TestService(TestRunRepository testRunRepository,
                       Map<String, LoadStrategy> strategies,
                       AttackStateService attackStateService,
                       LogStreamService logStreamService) {
        this.testRunRepository = testRunRepository;
        this.strategies = strategies;
        this.attackStateService = attackStateService;
        this.logStreamService = logStreamService;
    }

    public TestRun startTest(TestRun config) {
        // Guard: prevent duplicate attacks from spamming if one is already running
        if (attackStateService.isRunning()) {
            logStreamService.sendLog("[WARN] Ignoring duplicate start request — attack already in progress.");
            return testRunRepository.findAllByOrderByIdDesc().get(0);
        }

        config.setStartTime(LocalDateTime.now());
        config.setStatus("Running");
        TestRun savedRun = testRunRepository.save(config);

        // Execute the chosen strategy in a background thread so the HTTP response
        // returns immediately. The actual threads continue on the server regardless
        // of what the frontend is doing (page navigation, refresh, etc.)
        Thread attackThread = new Thread(() -> {
            LoadStrategy strategy = strategies.get(config.getStrategyType());
            if (strategy == null) {
                logStreamService.sendLog("[ERROR] Unknown strategy type: " + config.getStrategyType());
                savedRun.setStatus("Failed");
                testRunRepository.save(savedRun);
                return;
            }

            // Each strategy is now responsible for calling aggregatorService internally
            strategy.executeTest(savedRun);

            savedRun.setStatus("Completed");
            testRunRepository.save(savedRun);
        });

        attackThread.setDaemon(false); // Keep JVM alive until attack finishes
        attackThread.setName("aero-attack-main");
        attackThread.start();

        return savedRun;
    }

    public void stopTest() {
        attackStateService.requestAbort();
        logStreamService.sendLog("[WARN] Manual abort requested by user.");
    }

    public List<TestRun> getAllTests() {
        return testRunRepository.findAllByOrderByIdDesc();
    }

    public TestRun getLatestTest() {
        List<TestRun> runs = testRunRepository.findAllByOrderByIdDesc();
        return runs.isEmpty() ? null : runs.get(0);
    }
}