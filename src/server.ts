import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({
        ok: true,
        service: "voice-ai-qa-bot",
    });
});

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});