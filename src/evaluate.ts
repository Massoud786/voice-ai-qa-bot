import { getOpenAI } from "./openaiClient.js";



export type EvaluationResult = {
    callSid: string;
    createdAt: string;
    transcriptLength: number;
    scores: {
        clarity: number;     // 0-10
        relevance: number;   // 0-10
        sentiment: number;   // 0-10 (higher = more positive)
    };
    flags: {
        profanity: boolean;
        piiLikely: boolean;    // phone/email/address-ish
        emptyOrNoisy: boolean; // too short or mostly noise

    };
    summary: string;
    notes: string[];
};

function safeJsonParse<T>(text: string): T | null {
    try {
        return JSON.parse(text) as T;
    }
    catch {
        return null;
    }
}

export async function evaluateTranscript(callSid: string, transcript: string): Promise<EvaluationResult> {
    const openai = getOpenAI();
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in .env");
    }

    const system = `
    You are a strict JSON generator for a QA harness.

    Return ONLY valid JSON. No markdown. No extra text.
    All numeric scores must be integers from 0 to 10.

    Output Must match this exact schema:

    {
        "callSid": "string",
        "createdAt": "ISO-8601 string",
        "transcriptLength": number,
        "scores": {
            "clarity": number,
            "relevance": number,
            "sentiment": number
        },
        "flags": {
            "profanity": boolean,
            "piiLikely": boolean,
            "emptyOrNoisy": boolean
        },
        "summary": "string",
        "notes": ["string"]
    }

    Rules:
    - If the transcript is very short or mostly noise, set flags.emptyOrNoisy = true.
    - Only set flags.piiLikely = true if explicit phone numbers, emails, addresses,
    or government IDs are present in the transcript.
    - Put 2-5 bullet-like strings in notes (no markdown).
    `.trim();

    const user = `
    CallSid: ${callSid}

    Transcript:
    ${transcript}
    `.trim();

    // We ask for JSON as plain text and parse it ourselves.
    const resp = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
            { role: "system", content: system },
            { role: "user", content: user },
        ],
        max_output_tokens: 400,
    });

    const text = resp.output_text ?? "";
    const parsed = safeJsonParse<EvaluationResult>(text);

    if (!parsed) {
        throw new Error(`Model did not return valid JSON. Raw output:\n${text}`);
    }

    if (!parsed.scores || !parsed.flags) {
        throw new Error(`JSON missing required fields. Raw output:\n${text}`);
    }

    // Basic guardrails (B feature)
    const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

    parsed.scores.clarity = clamp(parsed.scores.clarity);
    parsed.scores.relevance = clamp(parsed.scores.relevance);
    parsed.scores.sentiment = clamp(parsed.scores.sentiment);

    // Ensure required fields exist (light validation)
    parsed.callSid = callSid;
    parsed.createdAt = new Date().toISOString();
    parsed.transcriptLength = transcript.length;

    return parsed;
}