import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({
        ok: true,
        service: "voice-ai-qa-bot",
    });
});

app.post("/twilio/voice", (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
        { voice: "alice"},
        "Hello. This is the Voice AI QA Bot webhook. Testing successful."
    );
    res.type("text/xml");
    res.status(200).send(twiml.toString());
});

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});