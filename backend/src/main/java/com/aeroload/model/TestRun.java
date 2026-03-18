package com.aeroload.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TestRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String targetUrl;
    private int concurrentUsers;
    private int durationSeconds;
    private String strategyType;
    private String status; // Pending, Running, Completed
    private LocalDateTime startTime;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public int getConcurrentUsers() { return concurrentUsers; }
    public void setConcurrentUsers(int concurrentUsers) { this.concurrentUsers = concurrentUsers; }
    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
    public String getStrategyType() { return strategyType; }
    public void setStrategyType(String strategyType) { this.strategyType = strategyType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
}