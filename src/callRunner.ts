import { getTwilioClient } from "./twilioClient.js";

export async function startTestCall(toNumber: string) {
    const from = process.env.TWILIO_FROM_NUMBER;
    const baseUrl = process.env.PUBLIC_BASE_URL;

    if (!from) throw new Error("Missing TWILIO_FROM_NUMBER in .env");
    if(!baseUrl) throw new Error("Missing PUBLIC_BASE_URL in .env");

    const client = getTwilioClient();

    const call = await client.calls.create({
        to: toNumber,
        from, 
        url: `${baseUrl}/twilio/voice`,
        method: "POST",
    });
    return call.sid;
}