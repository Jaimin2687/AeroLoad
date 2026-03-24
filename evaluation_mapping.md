# Assignment Evaluation Mapping: AeroLoad Concepts

Here is the exact mapping of where the requested programming concepts are implemented in the `AeroLoad` codebase. You can use these specific files and Line of Code (LOC) numbers to demonstrate your work to your faculty.

All code files referenced are located in the backend engine directory: 
`backend/src/main/java/com/aeroload/engine/`

---

### 1. Inheritance (Interface Implementation)
Inheritance is demonstrated by classes implementing shared interfaces to establish an "is-a" relationship and standard contracts.
* **File:** `SpikeTestStrategy.java`
* **LOC:** Line 16
  * `public class SpikeTestStrategy implements LoadStrategy`
* **File:** `RequestTask.java`
* **LOC:** Line 12
  * `public class RequestTask implements Runnable`

---

### 2. Polymorphism (Method Overriding)
Polymorphism is demonstrated through method overriding. Different test strategies implement the same interface method in their own unique way. The application can call `executeTest()` on any `LoadStrategy` object without knowing its specific concrete class.
* **File:** `SpikeTestStrategy.java`
* **LOC:** Line 33-34
  * `@Override public void executeTest(TestRun config)`
* **File:** `RampUpTestStrategy.java`
* **LOC:** Line 33-34
  * `@Override public void executeTest(TestRun config)`
* **File:** `RequestTask.java`
* **LOC:** Line 41-42
  * `@Override public void run()`

---

### 3. Multithreading & Concurrency
Multithreading is heavily used to generate concurrent load and to handle background I/O tasks efficiently.
* **File:** `SpikeTestStrategy.java` (Thread Pools & Executors)
* **LOC:** Line 42
  * `ExecutorService executor = Executors.newFixedThreadPool(...)`
* **LOC:** Line 49
  * `executor.submit(new RequestTask(...))`
* **File:** `MetricsFileHandler.java` (Raw Thread Creation & BlockingQueues)
* **LOC:** Line 20, 25, 55
  * Creates and starts a dedicated background Daemon `Thread` to process a `BlockingQueue` asynchronously.

---

### 4. File I/O
File Input/Output is used to persist live performance metrics to a CSV file from memory.
* **File:** `MetricsFileHandler.java`
* **LOC:** Lines 28, 38, 39
  * Writing to disk: `writer = new BufferedWriter(new FileWriter(filePath, true));`
  * `writer.write(metric); writer.newLine();`

---

### 5. Exception Handling
Exception handling is implemented to ensure the application does not crash when network requests timeout or the file system acts up.
* **File:** `RequestTask.java` (Handling Network Exceptions)
* **LOC:** Lines 47-64
  * A `try-catch-finally` block catches both `SocketTimeoutException | ConnectException` and general `IOException` to accurately determine target HTTP status codes manually.
* **File:** `MetricsFileHandler.java` (Handling I/O Exceptions)
* **LOC:** Lines 27-51
  * A `try-catch-finally` block managing `IOException | InterruptedException` specifically designed with a `finally` block to guarantee the `writer.close()` method runs to prevent memory leaks/file locks.
