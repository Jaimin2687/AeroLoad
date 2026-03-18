package com.aeroload.engine;

import com.aeroload.model.TestRun;

public interface LoadStrategy {
    void executeTest(TestRun config);
}