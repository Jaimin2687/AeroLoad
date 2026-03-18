package com.aeroload.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Singleton service that holds the global attack state.
 *
 * By keeping the abort signal here (server-side), the attack threads continue
 * running even when the frontend navigates away and re-opens its SSE connection.
 * The stop endpoint can flip abortRequested at any time without needing access
 * to the strategy's local variables.
 */
@Service
public class AttackStateService {

    private final AtomicBoolean isAttackRunning = new AtomicBoolean(false);
    private final AtomicBoolean abortRequested = new AtomicBoolean(false);

    public boolean isRunning() {
        return isAttackRunning.get();
    }

    public void markStarted() {
        abortRequested.set(false);
        isAttackRunning.set(true);
    }

    public void markFinished() {
        isAttackRunning.set(false);
    }

    public void requestAbort() {
        abortRequested.set(true);
    }

    public AtomicBoolean getAbortSignal() {
        return abortRequested;
    }
}
