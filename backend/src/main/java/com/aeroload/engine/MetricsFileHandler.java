package com.aeroload.engine;

import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

@Component
public class MetricsFileHandler {

    private final BlockingQueue<String> metricsQueue = new LinkedBlockingQueue<>(500000);
    private volatile boolean isRunning = true;
    private Thread writerThread;
    private final String filePath = "metrics.csv";

    @PostConstruct
    public void init() {
        writerThread = new Thread(() -> {
            BufferedWriter writer = null;
            try {
                writer = new BufferedWriter(new FileWriter(filePath, true));
                while (isRunning || !metricsQueue.isEmpty()) {
                    String metric = metricsQueue.poll(200, TimeUnit.MILLISECONDS);
                    if (metric != null) {
                        if ("CLEAR_FILE".equals(metric)) {
                            writer.close();
                            new File(filePath).delete();
                            writer = new BufferedWriter(new FileWriter(filePath, true));
                            continue;
                        }
                        writer.write(metric);
                        writer.newLine();
                        // CRITICAL: flush after every write so the data is on disk
                        // before aggregateAndSave() reads the file.
                        writer.flush();
                    }
                }
            } catch (IOException | InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                if (writer != null) {
                    try { writer.close(); } catch (IOException ignored) {}
                }
            }
        });
        writerThread.setName("metrics-writer");
        writerThread.setDaemon(true);
        writerThread.start();
    }

    public void queueMetric(String csvLine) {
        metricsQueue.offer(csvLine);
    }

    /**
     * Blocks until the internal write queue is fully drained to disk (or the
     * timeout elapses). Call this BEFORE reading metrics.csv for aggregation
     * so that all in-flight metric rows from worker threads are on disk.
     *
     * @param timeoutSeconds max time to wait
     */
    public void awaitDrain(int timeoutSeconds) {
        long deadline = System.currentTimeMillis() + (timeoutSeconds * 1000L);
        while (!metricsQueue.isEmpty() && System.currentTimeMillis() < deadline) {
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }

    public void clearFile() {
        metricsQueue.offer("CLEAR_FILE");
    }

    @PreDestroy
    public void cleanup() {
        isRunning = false;
        if (writerThread != null) writerThread.interrupt();
    }
}