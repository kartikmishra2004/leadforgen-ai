import express from "express";
import "dotenv/config";

import chatRoutes from "./routes/chat.routes.js";

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "https://leadforgen.in",
    "https://www.leadforgen.in"
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());

app.use("/api/chat", chatRoutes);

app.use("/api/health", (req, res) => {
    res.json({
        message: "LeadForGen AI Server is running",
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

app.use((err, req, res, next) => {
    res.status(500).json({
        message: "Something went wrong",
        status: "error",
        timestamp: new Date().toISOString(),
    });
});

export default app;
