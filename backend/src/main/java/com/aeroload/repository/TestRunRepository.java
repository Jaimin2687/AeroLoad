package com.aeroload.repository;

import com.aeroload.model.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestRunRepository extends JpaRepository<TestRun, Long> {
    List<TestRun> findAllByOrderByIdDesc();
}