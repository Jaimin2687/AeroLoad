package com.aeroload.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class ApiEndpoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String targetUrl;
    private String httpMethod;

    @OneToMany(mappedBy = "apiEndpoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestRun> testRuns;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    
    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }

    public List<TestRun> getTestRuns() { return testRuns; }
    public void setTestRuns(List<TestRun> testRuns) { this.testRuns = testRuns; }
}