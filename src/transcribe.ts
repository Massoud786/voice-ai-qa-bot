import fs from "fs";
import { openai } from "./openaiClient.js";

export async function transcribeWav(filePath: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in .env");
    }
    
    const result = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-transcribe",
        response_format: "json",
    });

    return result.text;
}