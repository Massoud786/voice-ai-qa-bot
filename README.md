# Voice AI QA Harness

End-to-end voice AI testing harness that simulates user calls, records conversations, generates transcript, and identifies quality issues in converstaional agents.  

## 🚀 Overview

Voice AI QA Harness is a backend service that integrates with Twilio to:

- Receive live voice calls via webhook
- Record and download audio files
- Transcribe conversations using OpenAI
- Evaluate call quality using structured AI scoring
- Detect potential PII exposure
- Expose analytics via REST API

The system stores structured artifacts per call:

outputs/<CallSid>/
- patient.wav
- transcript.txt
- evaluation.json

--- 

## 🧠 Why This Matters

Modern AI voice systems require automated quality monitoring, structured scoring, and compliance detection. This project simulates a production-style QA pipeline used for conversational AI testing and monitoring. 

## 🏗 Architecture

Caller  
↓  
Twilio Webhook  
↓  
Express Server (Node + TypeScript)  
↓  
Audio Recording (.wav)  
↓  
OpenAI Transcription  
↓  
AI Evaluation Engine  
↓  
Structured JSON Output  

---

## ✨ Features

- Asynchronous webhook-driven call processing via Twilio
- Automatic recording download with secure authentication
- AI-powered transcription 
- Structured QA scoring (clarity, relevance, sentiment)
- PII detection flags
- REST API to retrieve call analytics
- Robust filesystem validation
- Error handling to prevent webhook retries

---

## 📡 API Endpoints

### Health Check
GET /health

### List Calls
GET /calls

### Get Call Details
GET /calls/:callSid

Returns:
- Transcript
- Evaluation JSON
- Flags (PII, noise, profanity)
- QA Scores


---

## 🛠 Tech Stack

- Node.js
- TypeScript
- Express
- Twilio
- OpenAI API
- Axios
- File System (fs)
- ngrok (local tunneling)

---

## ▶️ How to Run

1. Install dependencies: npm install
2. Start dev server: npm run dev 
3. Expose via ngrok: ngrok http 3000
4. Configure Twilio webhook to: https://<your-ngrok-url>/twilio/voice

---

## 📊 Example Evaluation Output

```json
{
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "createdAt": "2026-02-22T21:28:38.506Z",
  "transcriptLength": 295,
  "scores": {
    "clarity": 8,
    "relevance": 9,
    "sentiment": 8
  },
  "flags": {
    "profanity": false,
    "piiLikely": false,
    "emptyOrNoisy": false
  },
  "summary": "Caller provided a positive update on project completion and integration of AI features.",
  "notes": [
    "Caller felt accomplished.",
    "Mentioned effective integration of AI.",
    "Provided a clear update on progress.",
    "Polite closing remarks."
  ]
}
```

---

## ⚠️ Edge Cases Handled

- Empty or noisy transcripts
- Invalid AI JSON responses
- Score validation (0-10 clamping)
- Missing environment variables
- Unexpected filesystem artifacts (.DS_Store)
- Webhook retry prevention 

