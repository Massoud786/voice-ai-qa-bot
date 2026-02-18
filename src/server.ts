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
        "Hello. This is the Voice AI QA Bot harness.");
    twiml.record({
        playBeep: true,
        timeout: 5,
        maxLength: 60,
        action: "/twilio/recording-complete",
        method: "POST",
        recordingStatusCallback: "/twilio/recording-status",
        recordingStatusCallbackMethod: "POST",
    });
    twiml.say({ voice: "alice" }, "Thanks. Goodbye.");
    res.type("text/xml").status(200).send(twiml.toString());
});

app.post("/twilio/recording-complete", (req, res) => {
    const { CallSid, RecordingSid, RecordingUrl, RecordingDuration } = req.body;

    console.log("[recording-complete]",{
        CallSid,
        RecordingSid,
        RecordingUrl,
        RecordingDuration,
    });

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: "alice"}, "Recording Received. Ending now.");
    twiml.hangup();

    res.type("text/xml").status(200).send(twiml.toString());
});

app.post("/twilio/recording-status", (req, res) => {
    const { CallSid, RecordingSid, RecordingUrl, RecordingStatus} = req.body;

    console.log("[recording-status]", {
        CallSid,
        RecordingSid,
        RecordingUrl,
        RecordingStatus,
    });

    // response fast so Twilio doesn't retry
    res.sendStatus(200);
})

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