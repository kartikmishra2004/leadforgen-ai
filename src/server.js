import express from "express";
import "dotenv/config";

import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(express.json());

app.use("/api/chat", chatRoutes);

app.use("/", (req, res) => {
    res.json({
        message: "LeadForGen AI Server is running",
    });
});

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});