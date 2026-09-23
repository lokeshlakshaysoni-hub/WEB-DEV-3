const express = require("express");

const app = express();

const logger = require("./middleware/logger");
const studentRoutes = require("./routes/studentRoutes");

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use("/students", studentRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Student Management REST API is running");
});

// Error handling
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});