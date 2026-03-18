package com.aeroload.repository;

import com.aeroload.model.AggregatedMetrics;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AggregatedMetricsRepository extends JpaRepository<AggregatedMetrics, Long> {
    AggregatedMetrics findByTestRunId(Long testRunId);
}