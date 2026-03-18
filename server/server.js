const express = require('express');
const app = express();
const port = 4000;

app.get('/api/fast', (req, res) => {
    res.status(200).json({ message: "Success", speed: "fast" });
});

app.get('/api/slow', (req, res) => {
    setTimeout(() => {
        res.status(200).json({ message: "Success", speed: "slow" });
    }, 2000);
});

app.get('/api/flaky', (req, res) => {

    if (Math.random() < 0.3) {
        return res.status(500).json({ error: "Internal Server Crash" });
    }
    res.status(200).json({ message: "Barely survived" });
});

app.listen(port, () => {
    console.log(`Victim API running at http://localhost:${port}`);
});