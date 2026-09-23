const express = require("express");

const app = express();

const studentRoutes = require("./routes/studentRoutes.js");
const logger = require("./middleware/logger.js");


// Middleware to read JSON data
app.use(express.json());

// Custom logger middleware
app.use(logger);


// Student routes
app.use("/students", studentRoutes);


// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Student Management REST API is running"
    });
});


// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});


// Start server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});