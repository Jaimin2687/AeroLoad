package com.aeroload.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TestRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Existing fields
    private String targetUrl;
    private int concurrentUsers;
    private int durationSeconds;
    private String strategyType;
    private String status; // Pending, Running, Completed
    private LocalDateTime startTime;

    // --- Entity Relationships ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_endpoint_id")
    private ApiEndpoint apiEndpoint;

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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ApiEndpoint getApiEndpoint() { return apiEndpoint; }
    public void setApiEndpoint(ApiEndpoint apiEndpoint) { this.apiEndpoint = apiEndpoint; }
}