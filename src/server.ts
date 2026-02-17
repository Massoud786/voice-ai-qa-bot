import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";
import { startTestCall } from "./callRunner";

dotenv.config();

const app = express();

// Twilio sends form-encoded bodies
app.use(express.urlencoded({ extended: false})); 
app.use(express.json())

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

app.post("/run", async (_req, res) => {
    try {
        const callSid = await startTestCall("5105637421");
        res.status(200).json({ok: true, callSid});
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ok: false, error: message})

    }
});

export default app;