# 🚀 AeroLoad

AeroLoad is a modern, high-performance web application designed for comprehensive API load testing and stress diagnostics. Built with a robust Java Spring Boot multithreaded backend and a sleek, real-time Next.js frontend, it allows developers to effortlessly simulate high-concurrency traffic, evaluate system thresholds, and receive real-time streaming telemetry.

## ✨ Key Features
- **Dynamic Concurrent Load Testing**: Execute Ramp-Up and Spike load testing strategies on any target API.
- **Real-Time Execution Terminal**: Monitor live worker-thread output, latencies, and server-sent events (SSE) directly via the dashboard.
- **Intelligent Auto-Kill Switch**: Automatically halts testing if the target API exceeds latency thresholds or cascading 50x errors occur, protecting the target system.
- **Diagnostic Reporting**: Automatically tallies total requests, average latency, P95 latency, and error rates, generating an aggregated post-attack diagnostics report.
- **In-Memory H2 Database**: Lightning-fast state tracking utilizing an auto-cleansing H2 database that requires zero initial setup.
- **Modern Next.js Frontend**: Fully responsive, UI enriched with Tremor charts, Tailwind CSS, and Lucide React icons.

## 🛠️ Technology Stack

**Backend Engine:**
- Java 17
- Spring Boot 3.2.4
- Spring Data JPA & Hibernate
- H2 In-Memory Database
- Native Multithreading / Concurrency Executors (`ExecutorService`)

**Frontend Dashboard:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Tremor (Metrics & Charting)
- Server-Sent Events (SSE) Integration for live terminals

## 🚀 Getting Started

### Prerequisites
- JDK 17+
- Node.js 18+
- Maven (Optional, standard `./mvnw` wrapper included)

### 1. Running the Backend (Spring Boot Server)
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
./mvnw spring-boot:run
```
> The backend server will start on `http://localhost:8080`. The H2 Console can be accessed (when running) at `http://localhost:8080/h2-console`.

### 2. Running the Frontend (Next.js Application)
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
> The mission control dashboard will start on `http://localhost:3000`. 

## 🧠 Architecture Overview
- **Multi-Threaded Execution**: Custom `LoadStrategy` interfaces dispatch thousands of simultaneous network cycles mapping `RequestTask` threads over dedicated Executor pools.
- **SSE Log Streaming**: Uses Spring's `SseEmitter` interfaced with native hooks on the Next.js side, enabling a zero-lag live terminal without UI polling.
- **Atomic Circuit Breakers**: Concurrency threads rely on `AtomicBoolean` and `AtomicInteger` references to prevent race conditions while cascading limits (e.g., stopping the attack natively directly after 15 consecutive error thresholds are crossed or limits surpassed).

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
