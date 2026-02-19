import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";
import { startTestCall } from "./callRunner";
import fs from "fs";
import path from "path";
import axios from "axios";

dotenv.config();

const app = express();

// Twilio sends form-encoded bodies
app.use(express.urlencoded({ extended: false})); 
app.use(express.json());

async function downloadTwilioRecording(recordingUrl: string, outPath: string) {
    // Twilio RecordingUrl is returned without a file extension 
    const mediaUrl = `${recordingUrl}.wav`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env");
    }
    // Ensure outputs/<CallSid>/ exists 
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true});

    // Download with HTTP Basic Auth (Twilio requires it)
    const response = await axios.get(mediaUrl, {
        responseType: "stream",
        auth: { username: accountSid, password: authToken},
    });

    // Stream to disk
    await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(outPath);
        response.data.pipe(writer);
        writer.on("finish", () => resolve());
        writer.on("error", reject);
    });
}

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

app.post("/twilio/recording-status", async (req, res) => {
    try {
    const { CallSid, RecordingSid, RecordingUrl, RecordingStatus} = req.body;

    console.log("[recording-status]", {
        CallSid,
        RecordingSid,
        RecordingUrl,
        RecordingStatus,
    });

    // Only download when recording is fully completed
    if (RecordingStatus === "completed" && CallSid && RecordingUrl) {
        const outPath = path.join("outputs", CallSid, "patient.wav");
        await downloadTwilioRecording(RecordingUrl, outPath);
        console.log("✅ Saved recording:", outPath);
    }

    
    // response fast so Twilio doesn't retry
    return res.sendStatus(200);
}
catch (err) {
    console.error("recording-status error:",err);
    return res.sendStatus(200);
}

});

app.post("/run", async (_req, res) => {
    try {
        const callSid = await startTestCall("+15105637421");
        return res.status(200).json({ ok: true, callSid});
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ok: false, error: message})
        // Still return 200 so Twilio does not keep retrying
        res.sendStatus(200);

    }
});

export default app;