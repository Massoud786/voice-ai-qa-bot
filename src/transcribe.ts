import fs from "fs";
import { getOpenAI } from "./openaiClient.js";

export async function transcribeWav(filePath: string): Promise<string> {
    const openai = getOpenAI();
    
    const result = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-transcribe",
        response_format: "text",
    });

    return result as string;
}