import express from "express";
import "dotenv/config";

import chatRoutes from "./routes/chat.routes.js";

const app = express();

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