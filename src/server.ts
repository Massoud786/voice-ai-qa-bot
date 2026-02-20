import express from "express";
import twilio from "twilio";
import { startTestCall } from "./callRunner.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { transcribeWav } from "./transcribe.js";
import { evaluateTranscript } from "./evaluate.js";

const app = express();

// Twilio sends form-encoded bodies
app.use(express.urlencoded({ extended: false }));
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
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });

    // Download with HTTP Basic Auth (Twilio requires it)
    const response = await axios.get(mediaUrl, {
        responseType: "stream",
        auth: { username: accountSid, password: authToken },
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
        { voice: "alice" },
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

    console.log("[recording-complete]", {
        CallSid,
        RecordingSid,
        RecordingUrl,
        RecordingDuration,
    });

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: "alice" }, "Recording Received. Ending now.");
    twiml.hangup();

    res.type("text/xml").status(200).send(twiml.toString());
});

app.post("/twilio/recording-status", async (req, res) => {
    try {
        const { CallSid, RecordingSid, RecordingUrl, RecordingStatus } = req.body;

        console.log("[recording-status]", {
            CallSid,
            RecordingSid,
            RecordingUrl,
            RecordingStatus,
        });

        // Only process when recording is fully completed
        if (RecordingStatus === "completed" && CallSid && RecordingUrl) {
            const outPath = path.join("outputs", CallSid, "patient.wav");
            const transcriptPath = path.join("outputs", CallSid, "transcript.txt");
            const evaluationPath = path.join("outputs", CallSid, "evaluation.json");

            // 1) Download WAV
            await downloadTwilioRecording(RecordingUrl, outPath);
            console.log("✅ Saved recording:", outPath);

            // 2) Transcribe WAV -> transcript.txt
            let transcriptText = "";
            try {
                transcriptText = await transcribeWav(outPath);
                await fs.promises.writeFile(transcriptPath, transcriptText, "utf8");
                console.log("✅ Saved transcript:", transcriptPath);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                await fs.promises.writeFile(
                    transcriptPath,
                    `TRANSCRIPTION FAILED:\n${message}`,
                    "utf8"
                );
                console.error("❌ Transcription failed:", message);

                // Optional: write a stub evaluation to keep artifact set consistent
                await fs.promises.writeFile(
                    evaluationPath,
                    JSON.stringify(
                        { ok: false, error: "Skipped evaluation because transcription failed" },
                        null,
                        2
                    ),
                    "utf8"
                );
                console.log("⚠️ Saved evaluation stub:", evaluationPath);

                // Always respond 200 to Twilio
                return res.sendStatus(200);
            }

            // 3) Evaluate transcript -> evaluation.json
            try {
                const evaluation = await evaluateTranscript(CallSid, transcriptText);
                await fs.promises.writeFile(
                    evaluationPath,
                    JSON.stringify(evaluation, null, 2),
                    "utf8"
                );
                console.log("✅ Saved evaluation:", evaluationPath);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                await fs.promises.writeFile(
                    evaluationPath,
                    JSON.stringify({ ok: false, error: message }, null, 2),
                    "utf8"
                );
                console.error("❌ Evaluation failed:", message);
            }
        }

        // Always respond 200 so Twilio doesn't retry
        return res.sendStatus(200);
    } catch (err) {
        console.error("recording-status handler error:", err);
        return res.sendStatus(200);
    }
});

app.post("/run", async (_req, res) => {
    try {
        const callSid = await startTestCall("+15105637421");
        return res.status(200).json({ ok: true, callSid });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ ok: false, error: message });
    }
});

export default app;