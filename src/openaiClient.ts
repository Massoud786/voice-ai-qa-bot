import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    if (client) return client;

    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) {
        throw new Error(
            "Missing OPENAI_API_KEY. Set it in your environment before calling OpenAI."
        );
    }
    client = new OpenAI({ apiKey});
    return client;
}
